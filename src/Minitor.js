import { AsyncLocalStorage } from 'node:async_hooks';

export class Minitor {

  static storage = null;
  static asyncContexts = new AsyncLocalStorage();

  static setStorage(storage) {
    this.storage = storage;
  }

  static monitored(verifyFunction, operationFunction, thisArg = undefined) {
    return (...argArray) => {
      const minitor = Minitor.asyncContexts.getStore();
      minitor.start(operationFunction.name, argArray);
      let result = null, error = null;

      try {
        result = operationFunction.apply(thisArg, argArray);
        return result;
      }
      catch (err) {
        error = err;
        throw err;
      }
      finally {
        if (verifyFunction) {
          minitor.verify(verifyFunction, result, error);
        }

        minitor.complete(result, error);
      }
    }
  }

  static monitoredAsync(verifyFunction, operationFunction, thisArg = undefined) {
    return async (...argArray) => {
      const minitor = Minitor.asyncContexts.getStore();
      minitor.start(operationFunction.name, argArray);
      let result = null, error = null;

      try {
        result = await operationFunction.apply(thisArg, argArray);
        return result;
      }
      catch (err) {
        error = err;
        throw err;
      }
      finally {
        if (verifyFunction) {
          minitor.verify(verifyFunction, result, error);
        }

        minitor.complete(result, error);
      }
    }
  }

  static monitor(trigger, monitoredFunction, thisArg = undefined) {
    return async (...argArray) => {
      const id = Minitor.storage.create({
        trigger,
        // args,
        startedAt: new Date(),
        completedAt: null,
        result: null,
        error: null,
        verifications: [],
        verificationSuccessful: true,
        successful: true,
      });

      const minitor = new MinitorInstance(id);
      await Minitor.asyncContexts.run(minitor, async () => {
        await monitoredFunction.apply(thisArg, argArray);
        await minitor.complete();
      });
    };
  }

  static async flush() {
    return this.storage.flush();
  }
}

export class MinitorInstance {

  constructor(rootId) {
    this.idStack = [rootId];
  }

  start(operation, args = []) {
    const id = Minitor.storage.create({
      operation,
      args,
      startedAt: new Date(),
      rootId: this.idStack[0],
      parentId: this.idStack[this.idStack.length - 1],
      completedAt: null,
      result: null,
      error: null,
      verifications: [],
      verificationSuccessful: true,
      successful: true,
    });

    this.idStack.push(id);
  }

  complete(result = null, error = null) {
    const id = this.idStack.pop();
    Minitor.storage.complete(id, {
      completedAt: new Date(),
      result,
      error,
    });
  }

  verify(verifyFunction, result, error) {
    const id = this.idStack[this.idStack.length - 1];

    try {
      const args = Minitor.storage.getArguments(id);
      if (!args) throw new Error("Arguments not found!");

      const verifications = verifyFunction(args, result, error);
      Minitor.storage.setVerifications(id, true, verifications);
    }
    catch (err) {
      Minitor.storage.setVerifications(id, false);
    }
  }
}
