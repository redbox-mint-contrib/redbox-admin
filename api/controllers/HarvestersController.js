/**
 * HarvestersController
 *
 * @description :: Server-side logic for managing harvesters
 */

module.exports = {
  get: function(req, res) {
    var request = require('request');
    var options = {
      url: sails.config.harvesters.url,
      headers: { 'Accept': 'application/json' }
    };
    function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        res.json({ status: 200, data: info });
      } else {
        console.log("Error code: " + response.statusCode + ", message: " + error);
        res.json({ status: response.statusCode, data: [] });
      }
    }
    request(options, callback);
  }
};
