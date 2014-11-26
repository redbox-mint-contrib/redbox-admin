/**
 * FormBuilderController
 *
 * @description :: Server-side logic for managing Formbuilders
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  formConfsPath : sails.config.instance['redbox'].installPath + "home/form-configuration/",
  /**
   * `List conf files from formConfsPath`
   */
  get: function (req, res) {
    var fl = [];
    if (module.exports.formConfsPath) {
      var fs = require('fs');
      fl = fs.readdirSync(module.exports.formConfsPath);
    } else {
      sails.log.error("No path is specified.");
    };
    res.json({ flist: fl });
  },
  getStageList:function (req, res) {
    var confName = req.param("fileName");
    if (confName) {
      var fs = require('fs');
      var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
      var stageArray = [];
      for(stage in obj.stages) {
        stageArray.push(stage);
      }
      res.json({stages: stageArray});
    }
  },
  addStage:function (req, res) {
    var confName = req.param("fileName");
    var stageName = req.param("stage");

    if (confName) {
      var fs = require('fs');
      var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
      if (!(stageName in obj.stages)) {
        obj.stages[stageName] = {};
      }
      var stageArray = [];
      for(stage in obj.stages) {
        stageArray.push(stage);
      }
      module.exports.saveConf(confName, obj);
      res.json({ stages: stageArray });
    } else {
      res.json({ stages: [] });
    }
  },
  removeStage:function (req, res) {
    var confName = req.param("fileName");
    var stageName = req.param("stage");

    if (confName) {
      var fs = require('fs');
      var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
      if (stageName in obj.stages) {
        delete obj.stages[stageName];
      }
      var stageArray = [];
      for(stage in obj.stages) {
        stageArray.push(stage);
      }
      module.exports.saveConf(confName, obj);
      res.json({ stages: stageArray });
    } else {
        res.json({ stages: [] });
    }
  },
  saveConf:function(confName, newConf) {
    confName = module.exports.formConfsPath + 't' + confName;
    console.warn("File is saved to a new name for testing:" + confName);
    var fs = require('fs');
    try {
      fs.writeFileSync(confName, JSON.stringify(newConf));
    } catch (e) {
      console.log("File: " + confName + " has not been updated. Reason: " + e);
    }
  }
};

