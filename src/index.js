import { MongoClient } from "mongodb";
import { Minitor } from "./Minitor.js";
import { MinitorStorage } from "./MinitorStorage.js";
import { it, toBeEqualTo, toBeFalsy } from "./MinitorVerifiers.js";

const DB_URL = "mongodb://localhost:27017/minitor";

setup();
async function setup() {
  let dbClient = null;

  try {
    dbClient = await new MongoClient(DB_URL).connect();
    const dbCollection = dbClient.db().collection("monitoring");
    Minitor.setStorage(new MinitorStorage(dbCollection));

    await main();
  }
  catch (err) {
    console.error(err);
  }
  finally {
    await Minitor.flush();
    await dbClient.close();
  }
}


const main = Minitor.monitor("startup.main", () => {
  incrementLastElement([1]);
  incrementLastElement([]);
  incrementLastElement([{}]);
});


const incrementLastElement = Minitor.monitored(
  verifyIncrementLastElement,
  (array) => {
    const lastElement = array.splice(-1)[0];

    if (lastElement && typeof lastElement === 'number') {
      array.push(lastElement + 1);
    }

    return array;
  }
);

function verifyIncrementLastElement(args, result, error, expected = undefined) {
  if (!expected) {
    const [array] = args;
    expected = {};
    expected.length = array.length;
  }

  return [
    it("should not change the array length", result.length, toBeEqualTo, expected.length),
    it("should not throw an error", error, toBeFalsy),
  ];
}
