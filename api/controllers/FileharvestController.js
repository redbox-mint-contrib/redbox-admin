/**
 * FileharvestController
 *
 * @description :: Server-side logic for managing files to harvest
 * @help        :: 
 * @author      :: Shilo Banihit
 */

module.exports = {

  /**
   * `FileharvestController.get()`
   *
   * Returns files in the target directory if the file name is unspecified. Otherwise, returns the contents of the file
   *
   */
  get: function (req, res) {
    var fs = require('fs');
    var config = sails.controllers.fileharvest.getConfig(req, res);
    if (config.fileName) {
        // this will likely lock the file for reading, if so, it will 
        // cause failure of the last harvest step process when the file is moved
        var fullPath = config.targetDir + "/" + config.fileName;
        if (fs.existsSync(fullPath)) {
            // return the contents of the file
            return res.download(fullPath);
        } else {
            return res.send(404, "File does not exist.");   
        }
    } else {
        // return files in the target directory...
        var files = fs.readdirSync(config.targetDir);
        return res.json({
            sysType: config.sysType,
            files: files
        });
    }
  },


  /**
   * `FileharvestController.create()`
   * 
   *  Saves files into the target directory
   */
  create: function (req, res) {
    var fs = require('fs');
    var config = sails.controllers.fileharvest.getConfig(req, res);
    if (config.fileName) {
        req.file('file').upload({maxBytes:100000000}, function(err, files) {
            if (err) {
              sails.log.error(err);
              return res.send(400, "Error uploading file.");
            }
            // copy the file(s) to the target directory...
            sails.log.debug("Receiving files, number: " + files.length);
            for (var i=0; i<files.length; i++) {
                try {
                  sails.controllers.fileharvest.runFilter(config);
                  fs.renameSync(files[i].fd, config.targetDir + "/" + config.fileName);
                } catch (err) {
                  fs.unlink(config.targetDir + "/" + config.fileName, function(err) {
                    if (err) {
                      sails.log.error("Error deleting file after upload failure:"+files[i].fd);
                    }
                  });
                  sails.log.error("Error moving file to " + config.targetDir + "/" + config.fileName, + ": " + err);
                  return res.send(400, "Error moving file to target directory:" + err);
                }
            }
            return res.json({
              message: files.length + " file(s) uploaded successfully",
              files: files
            });
        });
    } else {
        return res.send(400, "Specify a file name.");
    }
  },


  /**
   * `FileharvestController.update()`
   */
  update: function (req, res) {
    return res.json({
      todo: 'update() is not implemented yet!'
    });
  },


  /**
   * `FileharvestController.delete()`
   */
  delete: function (req, res) {
    var fs = require('fs');
    var config = sails.controllers.fileharvest.getConfig(req, res);
    try {
      sails.controllers.fileharvest.runFilter(config);
      fs.unlink(config.targetDir + "/" + config.fileName, function(err) {
        if (err) {
          throw err;
        }
        return res.json({
          fileName: config.fileName
        });
      });
    } catch (err) {
      return res.send(400, "Error deleting file.");
    }
  },
  
  // Convenience method for getting config block...
  getConfig: function(req, res) {
    var fileName = req.param('fileName');
    var sysType = req.param('sysType');
    sails.log.debug("sysType:" + sysType);
    var targetDir = sails.config.fileHarvest[sysType].targetDir;
    sails.log.debug("TargetDir:" + targetDir);
    sails.log.debug("fileName:" + fileName);
    return {fileName:fileName, sysType:sysType, targetDir:targetDir};
  },
  
  runFilter: function(config) {
    if (config.fileName.indexOf('vlc-') >=0) {
      throw "File was filtered.";
    }
  }
};

