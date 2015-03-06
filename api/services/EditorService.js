/**
 * EditorService
 *
 * @description :: Sails service for manging files reltated config-editor
 * @help        :: See http://links.sailsjs.org/docs/services
 */

module.exports = {
  formConfsPath : sails.config.instance['redbox'].installPath + "home/form-configuration/",
  saveConf:function(confName, newConf) {
    // confName: name of configuration json. It can also have an relative path to module.exports.formConfsPath in front of file name
    // return: status which be safely ignored by caller

    var status = {code:200};
    var path = require('path');
    var dirName = path.dirname(confName);
    if (dirName == '.') {
      dirName = '';
    } else {
      dirName = '../' + dirName + '/';
      confName = path.basename(confName);
    }
    var working_dir = module.exports.formConfsPath + dirName;

//    console.log('confName = ' + confName);
//    console.log('dirname = ' + dirName);

    var backup = working_dir + 'backup_' + confName;
    confName = working_dir + confName
//    console.log("Saving to " + confName);
//    return status;

    var fs = require('fs');

    try {
      // backup first
      fs.renameSync(confName, backup);
      fs.writeFileSync(confName, JSON.stringify(newConf));
    } catch (e) {
      console.error("File: " + confName + " has not been updated. Reason: " + e);
      status['code'] = 400;
      status['message'] = "Failed to save.";
    }
    return status;
  }
};
