import { v4 as uuid } from "uuid";

export class MinitorStorage {

  constructor(collection) {
    this.collection = collection;
    this.activeCache = new Map();
    this.promises = new Set();
  }

  create(creationData) {
    const doc = {
      ...creationData,
      _id: uuid(),
    };

    this.activeCache.set(doc._id, doc);

    const promise = this.collection.insertOne(doc);
    this.promises.add(promise);
    promise
      .then(() => this.promises.delete(promise))
      .catch(console.error);

    return doc._id;
  }

  getArguments(id) {
    return this.activeCache.get(id)?.args;
  }

  setVerifications(id, verificationSuccessful, verifications = []) {
    const cached = this.activeCache.get(id);
    this.activeCache.set(id, { ...cached, verificationSuccessful, verifications });

    if (verifications.some(v => !v.successful)) {
      this.activeCache.get(cached.parentId).successful = false;
    }

    const promise = this.collection.updateOne({ _id: id }, { $set: { verificationSuccessful, verifications } });
    this.promises.add(promise);
    promise
      .then(() => this.promises.delete(promise))
      .catch(console.error);
  }

  complete(id, completionData) {
    const cached = this.activeCache.get(id);
    const successful = cached.successful && cached.verifications.every(v => v.successful);

    const promise = this.collection.updateOne({ _id: id }, { $set: { ...completionData, successful } });
    this.promises.add(promise);
    promise
      .then(() => this.promises.delete(promise))
      .catch(console.error);
  }

  async flush() {
    return Promise.all([...this.promises]);
  }

}
