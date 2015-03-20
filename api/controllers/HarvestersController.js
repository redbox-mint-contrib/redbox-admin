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
  },
  act: function(req, res) {
    var action = req.param("action");
    var harvestId = req.query["harvestId"];
    if (['isStarted', 'start', 'stop'].indexOf(action) >= 0) {
      // all these actions need harvestId
      if (harvestId.trim().length > 1) {
        module.exports.call([action, harvestId], null, res);
      } else {
        res.json({status:400, message: "Not supported"});
      }
    } else {
      res.json({status:400, message: "Not supported"});
    }
  },
// Internal functions from here
  call: function(paths, args, responder) {
    function build_path(paths, args) {
      // Build url path
      // paths: array, segments of a full path of an RESTful API call
      // args: object, used to construct query aruments
      var path = paths.join('/');
      if (args) {
        var queries = [];
        for (var k in args) {
          queries.push(k+'='+args[k]);
        }
        path += '?' + queries.join('&');
      }
      return path;
    }

    var request = require('request');
    var options = {
      url: sails.config.harvesters.url + build_path(paths, args),
      headers: { 'Accept': 'application/json' },
      timeout: 60000
    };
    console.log("Calling url:");
    console.log(options.url);

    function callback(error, response, body) {
      var result = {};
      if (!error && response && response.statusCode == 200) {
        var info = JSON.parse(body);
        result = { status: 200, data: info };
      } else {
        console.log("Error:");
        console.log(error);
        result = { status: 500, data: [] };
      }
      console.log(result);
      responder.json(result);
    }

    request(options, callback);
  }
};

