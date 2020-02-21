const path = require('path');

const MONGO_TEST_CONFIG_FILENAME = path.join(__dirname, '.cache', 'mongoTestConfig.json');

module.exports = { MONGO_TEST_CONFIG_FILENAME };
