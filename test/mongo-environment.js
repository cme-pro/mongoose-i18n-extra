const NodeEnvironment = require('jest-environment-node');
const fs = require('fs');
const { MONGO_TEST_CONFIG_FILENAME } = require('./variables');

class MongoEnvironment extends NodeEnvironment {
  async setup() {
    const globalConfig = JSON.parse(fs.readFileSync(MONGO_TEST_CONFIG_FILENAME, 'utf-8'));

    this.global.__MONGO_URI__ = globalConfig.mongoUri;
    this.global.__MONGO_DB_NAME__ = globalConfig.mongoDBName;
    this.global.__MONGO_OPTS__ = {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true,
    };

    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }
}

module.exports = MongoEnvironment;
