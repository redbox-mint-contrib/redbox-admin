/**
 * HarvestersController
 *
 * @description :: Server-side logic for managing harvesters
 * return to client an object: status, message and data. Last two keys do not always exist
 */
var request = require('request');
// call json-harvester-manager
  function call(paths, args, responder) {
    /* return value: object, keys: status, data: either message string returned by API or list of harvesters
    */
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

//    var request = require('request');
    var options = {
      url: sails.config.harvesters.url + build_path(paths, args),
      headers: { 'Accept': 'application/json' },
      timeout: 60000 // Used for starting a havester. It often times out. No message sends back
    };
    console.log("Calling url:");
    console.log(options.url);
    request(options, messenger(responder));
  }
  function install(fpath, harvestId, res) {
      /*
    // works with request@2.54, untill updated, comment out
    var formData = {
      harvesterPackage: require('fs').createReadStream(fpath)
    };
    request.post({
      url: 'http://localhost:8080/json-harvester-manager/harvester/upload/' + harvestId,
      formData: { harvesterPackage: require('fs').createReadStream(fpath) },
      headers: { 'Accept': 'application/json' }
    }, function (err, httpResponse, body) {
      if (err) {
        res.json({status:500, message: JSON.stringify(err)});
        return console.error('upload failed:', err);
      }
      console.log('Upload successful!  Server responded with:', body);
      res.json({status:200, message: JSON.stringify(body)});
    });
    */
    // TODO: update app's request version to 2.54 or above. Before that, set headers, especially content-length ourselves
/*      function requestCallback(err, httpResponse, body) {
      if (err) {
        res.json({status:500, message: JSON.stringify(err)});
        return console.error('upload failed:', err);
      }
      console.log('Upload successful!  Server responded with:', body);
      res.json({status:200, message: JSON.stringify(body)});
    }
*/
    var FormData = require('form-data');

    var form = new FormData();
    form.append("harvesterPackage", require('fs').createReadStream(fpath));

    form.getLength(function (err, length) {
      if (err) {
        return messenger(res)(err);
      }
      var r = request.post(sails.config.harvesters.url + 'upload/' + harvestId, messenger(res));
      r._form = form;
      r.setHeader('content-length', length);
      r.setHeader('Accept', 'application/json');
    });
  }

/* Used as a callback to send results to front end caller */
function messenger(r) {
  var responder = r;
  return function (error, response, body) {
      var result = { status: 200, data: []};
      if (!error && response && response.statusCode == 200) {
        var info = JSON.parse(body);
        // If API call to json-harvester-manager with an action finished successfully, it returns an object:
        // { success: true, message: 'Removed harvester:de' }
        if (info.hasOwnProperty('success')) {
          if (!info.success) {
            result['status'] = 400;
          }
        }
        if (info.hasOwnProperty('message')) {
          result.message = info.message;
        } else {
          // default call to json-harvester-manager only returns an array
          result.data = info;
        }
      } else {
        console.error("Error:");
        console.error(error);
        result.status = 500;
        result.message = JSON.stringify(error);
      }
      console.log(result);
      responder.json(result);
    }
}

module.exports = {
  get: function(req, res) {
    call([], null, res);
  },
  act: function(req, res) {
    var action = req.param("action");
    var harvestId = req.query["harvestId"];
    if (['isStarted', 'start', 'stop', 'remove', 'upload'].indexOf(action) >= 0) {
      // all these actions need harvestId
      if (harvestId.trim().length > 1) {
        if (action == 'upload') {
          var fileName = req.query["fileName"];
          if (fileName) {
            console.log("Uploading %s/%s to be installed as %s", sails.config.fileHarvest['harvestermanager'].targetDir, fileName, harvestId);
            install(sails.config.fileHarvest['harvestermanager'].targetDir + '/' + fileName, harvestId, res);
          } else {
            res.json({status:400, message: "Missing pakage file"});
          }
        } else {
          call([action, harvestId], null, res);
        }
      } else {
        res.json({status:400, message: "Not supported or missing harvester ID"});
      }
    } else {
      res.json({status:400, message: "Not supported"});
    }
  }
};
