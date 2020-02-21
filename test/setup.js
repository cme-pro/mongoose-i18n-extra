const fs = require('fs-extra');
const path = require('path');
const MongodbMemoryServer = require('mongodb-memory-server');

const { MONGO_TEST_CONFIG_FILENAME } = require('./variables');

module.exports = async function() {
  // const mongoServer = { stop: () => {} };
  // const mongoUri = 'mongodb://localhost:27017/test';

  const mongoServer = new MongodbMemoryServer.MongoMemoryServer({ debug: false });
  const mongoUri = await mongoServer.getConnectionString();
  const dir = path.join(__dirname, '.cache');

  await fs.ensureDir(dir);
  await fs.remove(MONGO_TEST_CONFIG_FILENAME);
  await fs.writeFile(
    MONGO_TEST_CONFIG_FILENAME,
    JSON.stringify({
      mongoDBName: 'test',
      mongoUri,
    })
  );

  // Set reference to mongod in order to close the server during teardown.
  global.__MONGOD__ = mongoServer;
};
