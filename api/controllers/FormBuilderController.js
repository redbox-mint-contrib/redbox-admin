/**
 * FormBuilderController
 *
 * @description :: Server-side logic for managing Formbuilders
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  gfs: require('fs'),
  formConfsPath : sails.config.instance['redbox'].installPath + "home/form-configuration/",
  /**
   * `List conf files from formConfsPath`
   */
  get: function (req, res) {
    var fl = [];
    if (module.exports.formConfsPath) {
      var fs = module.exports.gfs;
      var tfl = fs.readdirSync(module.exports.formConfsPath);
      tfl.forEach(function(f) {
        if((! fs.statSync(module.exports.formConfsPath + f).isDirectory()) && module.exports.isFormDef(f)) {
          // TODO: filter backups
          fl.push(f);
        }
      });
    } else {
      sails.log.error("No path is specified.");
    };
    res.json({ flist: fl });
  },
  isFormDef: function(f) {
    var fs = module.exports.gfs;
    var obj = {};
    try {
      obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + f));
    } catch (e) {
      sails.log.warn('Cannot parse JSON file: ' + module.exports.formConfsPath + f);
      sails.log.warn(e);
    }
    return 'stages' in obj;
  },
  getStageList:function (req, res) {
    var confName = req.param("fileName");
    if (confName) {
      var fs = module.exports.gfs;
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
      var fs = module.exports.gfs;
      var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
      if (!(stageName in obj.stages)) {
        obj.stages[stageName] = {};
      }
      var stageArray = [];
      for(stage in obj.stages) {
        stageArray.push(stage);
      }
      EditorService.saveConf(confName, obj);
      res.json({ stages: stageArray });
    } else {
      res.json({ stages: [] });
    }
  },
  removeStage:function (req, res) {
    var confName = req.param("fileName");
    var stageName = req.param("stage");

    if (confName) {
      var fs = module.exports.gfs;
      var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
      if (stageName in obj.stages) {
        delete obj.stages[stageName];
      }
      var stageArray = [];
      for(stage in obj.stages) {
        stageArray.push(stage);
      }
      EditorService.saveConf(confName, obj);
      res.json({ stages: stageArray });
    } else {
        res.json({ stages: [] });
    }
  }
};
