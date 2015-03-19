/**
 * WorkflowDefController
 *
 * @description :: Server-side logic for viewing ReDBox work flow configuration file of a data type
 */

module.exports = {
  gfs: require('fs'),
  defPath: sails.config.instance['redbox'].installPath + "home/harvest/workflows/",
  formSchema: "form-schema_stage.json", //Default name of schema
  getDataTypes: function (req, res) {
    /**
     * List JSONs of data type
     */
    var fl = [];
    if (module.exports.defPath) {
      var fs = module.exports.gfs;
      var tfl = fs.readdirSync(module.exports.defPath);
      tfl.forEach(function (f) {
        if (module.exports.isTypeDef(f)) {
          fl.push(f);
        }
      });
    } else {
      sails.log.error("No path is specified.");
    };
    res.json({
      flist: fl
    });
  },
  getDef: function (req, res) {
    /**
     * Get the definition JSON of a data type
     */
    var confName = req.param("dataType");
    if (confName) {
      var fs = module.exports.gfs;
      var obj = JSON.parse(fs.readFileSync(module.exports.defPath + confName));
      res.json({
        content: obj
      });
    }
  },
  // below are internal functions
  isTypeDef: function (f) {
    var fs = module.exports.gfs;
    var fPath = module.exports.defPath + f;
    if (fs.statSync(fPath).isDirectory()) {
      return false;
    }
    var path = require('path');
    var bn = path.basename(f, '.json');
    // if file name has no .json as ext or has backup at the beginning, the file is not qualified
    if (bn == f || bn.indexOf('backup') == 0) {
      return false;
    }
    var obj = {};
    try {
      obj = JSON.parse(fs.readFileSync(fPath));
    } catch (e) {
      sails.log.warn(fPath + ' was not parsed successfully by JSON, it says:');
      sails.log.warn(e);
    }
    return 'stages' in obj;
  }
};
