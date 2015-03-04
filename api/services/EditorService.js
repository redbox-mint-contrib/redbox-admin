/**
 * EditorService
 *
 * @description :: Sails service for manging files reltated config-editor
 * @help        :: See http://links.sailsjs.org/docs/services
 */

module.exports = {
  gfs: require('fs'),
  formConfsPath : sails.config.instance['redbox'].installPath + "home/form-configuration/",
  saveConf:function(confName, newConf) {
    // it returns status json which can be used when client needs it
    // or it can be safely ignored by caller
    var backup = module.exports.formConfsPath + 'backup_' + confName;
    confName = module.exports.formConfsPath + confName

    var fs = module.exports.gfs;
    // backup first
    fs.renameSync(confName, backup);

    var status = {code:200};
    try {
      fs.writeFileSync(confName, JSON.stringify(newConf));
    } catch (e) {
      console.log("File: " + confName + " has not been updated. Reason: " + e);
      status['code'] = 400;
      status['message'] = "Failed to save.";
    }
    return status;
  }
};
