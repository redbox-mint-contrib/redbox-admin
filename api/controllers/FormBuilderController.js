/**
 * FormBuilderController
 *
 * @description :: Server-side logic for managing Formbuilders
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  formConfsPath : "/opt/redbox/home/form-configuration/",
  getStageList:function (req, res) {
    var confName = req.param("fileName");
    if (confName) {
        var fs = require('fs');
        //~ confName = "/opt/redbox/home/form-configuration/arms_form.json";
        //~ var obj = JSON.parse(fs.readFileSync("/opt/redbox/home/form-configuration/" + confName));
        console.log(module.exports.formConfsPath);
        var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
        var stageArray = [];
        for(stage in obj.stages) {
            stageArray.push(stage);
        }
        //res.send(obj);
        stageArray.sort();
        res.json({
                stages: stageArray
        });
    } else {
        res.json({
                    name: req.param("fileName")
                });
            }
    },
  /**
   * `FormBuilderController.get()`
   */
  get: function (req, res) {
    // TODO: configure where to find the installation of ReDBox
    sails.log.info("Fixed path is used: " + module.exports.formConfsPath);

    var fileName = req.param('formConf');
    if (fileName) {
        sails.log.debug("Scan stage names from file: " + fileName);
    } else {
        sails.log.debug("Default behaviour: load form list");
        var fl = null;
        if (module.exports.formConfsPath) {
          var fs = require('fs');
            fl = fs.readdirSync(module.exports.formConfsPath);
        } else {
          sails.log.debug("No path is specified.");
        };
        res.json({
                flist: fl
            });
    }
  },
  addStage:function (req, res) {
    var confName = req.param("fileName");
    var stageName = req.param("stage");
    //~ console.log(confName);
    //~ console.log(stageName);

    if (confName) {
        var fs = require('fs');
        console.log(module.exports.formConfsPath);
        var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
        if (!(stageName in obj.stages)) {
            obj.stages[stageName] = {};
        }
        var stageArray = [];
        for(stage in obj.stages) {
            stageArray.push(stage);
        }
        stageArray.push("File is not saved");
        stageArray.sort();
        module.exports.saveConf(confName, obj);
        res.json({
                stages: stageArray
        });
    } else {
        res.json({
                    stages: []
                });
            }
    },
  removeStage:function (req, res) {
    var confName = req.param("fileName");
    var stageName = req.param("stage");
    //~ console.log(confName);
    //~ console.log(stageName);

    if (confName) {
        var fs = require('fs');
        console.log(module.exports.formConfsPath);
        var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
        if (stageName in obj.stages) {
            console.log("Find " + stageName + ", going to remove it");
            delete obj.stages[stageName];
        }
        var stageArray = [];
        for(stage in obj.stages) {
            stageArray.push(stage);
        }
        stageArray.push("File is not saved");
        stageArray.sort();
        module.exports.saveConf(confName, obj);
        res.json({
                stages: stageArray
        });
    } else {
        res.json({
                    stages: []
                });
            }
    },
  saveConf:function(confName, newConf) {
      var fs = require('fs');
      try {
        console.warn("File path is not used, so it is saved to redbox-admin/");
        fs.writeFileSync(confName, JSON.stringify(newConf));
      } catch (e) {
        console.log("File: " + confName + " has not been updated. Reason: " + e);
      }
  }
};

