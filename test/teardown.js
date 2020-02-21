const fs = require('fs-extra');

const { MONGO_TEST_CONFIG_FILENAME } = require('./variables');

module.exports = async function() {
  console.log('Teardown mongodb server...', MONGO_TEST_CONFIG_FILENAME);
  await fs.unlink(MONGO_TEST_CONFIG_FILENAME);
  await global.__MONGOD__.stop();
  console.log('Mongodb server stopped');
};
