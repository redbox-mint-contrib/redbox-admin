// check for local, then fallback to development.
var fs = require('fs');
var localConfigPath = '../config/local';
var devConfigPath = '../config/env/development';
var config = undefined;
if (fs.existsSync(localConfigPath + '.js')) {
  console.log("Using local settings...");
  config = require(localConfigPath);
} else {
  console.log("Using development settings...");
  config = require(devConfigPath);
}
module.exports = config;