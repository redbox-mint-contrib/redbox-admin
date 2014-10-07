/**
 * ConfigController
 *
 * @description :: Server-side logic for managing configs
 * @help        :: See http://links.sailsjs.org/docs/controllers
 * @author      :: Shilo Banihit
 */

module.exports = {

  /**
   * `ConfigController.read()` - api for reading blocks or specific entries of configuration.
   */
  read: function (req, res) {
    sails.controllers.config.getValue(sails.controllers.config.parseCmd(req, res, 'field'), res);
  },
  /**
   * `ConfigController.write()` - api for writing blocks or specific entries of configuration.
   */
  write: function (req, res) {
    var cmd = sails.controllers.config.parseCmd(req, res, 'field');
    sails.controllers.config.putValue(cmd, res);
  },    
  /**
  *  `ConfigController.getSection()` - api for retrieving configurable sections
  */
  getSection: function(req, res) {
    var sectionName = req.param('key');
    // returns the list of sections when section name is not specified
    if (sectionName == null) {
      var cmd = sails.controllers.config.parseCmd(req, res, 'section');
      var sections = [];
      for (var section in cmd.sysConfig.section) {
        sections.push({id:section, title:cmd.sysConfig.section[section].title});
      }
      return res.json({sections:sections});  
    }
    // returns the schemas
    var cmd = sails.controllers.config.parseCmd(req, res, 'section', function() {
      var subsections = [];
      var defaultForm = ["*"]; // TODO: retrieve from config
      for (var keyConfig in cmd.keyConfigs) {
        var subsection = {id:cmd.keyConfigs[keyConfig].source, schema: cmd.keyConfigs[keyConfig].schemaData, form: cmd.keyConfigs[keyConfig].form ? cmd.keyConfigs[keyConfig].form : defaultForm, model: cmd.keyConfigs[keyConfig].srcData};
        subsections.push(subsection); 
      }
       return res.json({id:cmd.key, subsections:subsections});
    });
  },
  /**
  *  `ConfigController.setSection()` - api for saving a configurable section
  */
  setSection: function(req, res) {
    var sectionName = req.param('key');
    if (sectionName == null) {
      return res.send(400, "No section name");
    }
    // validate section data...
    
    // save the section...
    var cmd = sails.controllers.config.parseCmd(req, res, 'section', function() {
      var rbSection = req.body;
      var cb = function(rbSection, res) {
        var ctr = 0;
        return function() {
          ctr++;
          if (ctr == rbSection.subsections.length) {
            return res.json(rbSection);
          }
        }
      }(rbSection, res);
      var tv4 = require('tv4');
      for (var i=0; i<rbSection.subsections.length; i++) {
        var sourceId = rbSection.subsections[i].id;
        var srcPath = cmd.keyConfigs[sourceId].srcPath;
        var schema = {};
        var writeCb = function(srcPath, model, cb) {
          return function() {
            var result = tv4.validateMultiple(model, schema.data);
            if (result.valid == true) {
              sails.log.debug("Writing to file: " + srcPath);
              sails.log.debug(model);
              sails.controllers.config.writeFile(srcPath, JSON.stringify(model, null, "\t"), cb, function() { res.send(400, "Error writing to one of the files");});
            }
          }
        }(srcPath, rbSection.subsections[i].model, cb);
        sails.controllers.config.loadJson(cmd.keyConfigs[sourceId].schemaPath, true, schema, 'data', writeCb);
      }
    });
  },
  
  loadJson: function(path, parse, target, field, cb) {
    var fs = require('fs');
    var json = fs.readFile(path, {flags:'r', encoding:'UTF-8'}, function(err, data) {
      if (parse) {
        target[field] = JSON.parse(data);
      } else {
        target[field] = data;
      }
      cb();
    });
  },
    
  writeFile: function(path, strData, cb, errCb) {
    var fs = require('fs');
    var json = fs.writeFile(path, strData, {flags:'w', encoding:'UTF-8'}, function(err) {
      if (err) {
        sails.log.error("Error writing to file:" + path);
        if (errCb) errCb();
        return;
      }
      if (cb) cb();
    });
  },
  
  returnJson: function(res, key, value) {
     res.json({
      key:key,
      value:value
    });
  },
  
  getValue: function(config, res) {
    var shell = require('shelljs'), key = config.sysConfig[config.configType][config.key].key;
    
    if (config.configType == "field") {
      if (config.srcExt == ".json") {
        var fs = require('fs'), es = require('event-stream'), JSONStream = require('JSONStream');
        fs.createReadStream(config.srcPath, {flags:'r', encoding:'UTF-8'})
        .pipe(JSONStream.parse(key))
        .pipe(es.mapSync(function (data) {
          sails.controllers.config.returnJson(res, config.key, data);
        }));  
      } else {
        sails.controllers.config.returnJson(res, key, shell.grep(key, config.srcPath).replace(key, '').replace(/\s+$/,'').replace(/^"|"$/g,''));
      }
    }
  },
  
  putValue: function(config, res) {
    var shell = require('shelljs'), key = config.sysConfig[config.configType][config.key].key;
    if (config.configType == "field") {
      if (config.srcExt == ".json") {
        var fs = require('fs'), key = config.sysConfig[config.configType][config.key].key;
        var src = fs.readFile(config.srcPath, {flags:'r', encoding:'UTF-8'}, function(err, data) {
          if (err) {
            sails.log.error("Failed to read source file");
            res.send(400, "Error reading source file.");
            return;
          }
          var setVal = function(data, keyArr, val, idx) {
            for (var item in data) {
              if (item == keyArr[idx]) {
                if (typeof data[item] == 'object') {
                  setVal(data[item], keyArr, val, ++idx);
                } else {
                  data[item] = val;
                  break;
                }
              }
            }
          };
          data = JSON.parse(data);
          setVal(data, key, config.value, 0);
          fs.writeFile(config.srcPath, JSON.stringify(data, null, "  "), {flags:'w', encoding:'UTF-8'}, function(err) {
            if (err) {
              sails.log.error("Error writing to tmp file");
              res.send(400, "Error writing to temp file");
              return;
            }
            sails.controllers.config.getValue(config, res);
          });
        });
      } else {
        var currentLine = shell.grep(key, config.srcPath).replace(/\s+$/,'');
        var currentValue = currentLine.replace(key, '');
        var newLine = currentLine.replace(currentValue, config.value);
        shell.sed('-i', currentLine, newLine, config.srcPath);
      }
    } 
  },

  getSysFilePath: function(cmd, cb) {
    cmd.keyConfigs = {};
    var jsonDataCb = function(subSecCnt) {
      var subSecCtr = 0;
      return function(keyConfig) {
        return function() {
          if (keyConfig.schemaData && keyConfig.srcData) {
            subSecCtr++;
            if (subSecCtr==subSecCnt) cb();
          }
        }
      };
    };
    var dataCbInst = jsonDataCb(cmd.sysConfig[cmd.configType][cmd.key].subsections.length);
    for (var i=0; i<cmd.sysConfig[cmd.configType][cmd.key].subsections.length; i++) {
      var keyConfig = cmd.sysConfig[cmd.configType][cmd.key].subsections[i];
      keyConfig.srcPath = sails.config.instance[cmd.sysType].installPath + cmd.sysConfig.source[keyConfig.source].path;
      keyConfig.schemaPath =  sails.config.instance[cmd.sysType].installPath + cmd.sysConfig.source[keyConfig.source].schema;
      keyConfig.srcExt = sails.controllers.config.getSysFileExt(keyConfig.srcPath);
      cmd.keyConfigs[keyConfig.source] = keyConfig;
      sails.controllers.config.loadJson(keyConfig.schemaPath, true, keyConfig, 'schemaData', dataCbInst(keyConfig));
      sails.controllers.config.loadJson(keyConfig.srcPath, true, keyConfig, 'srcData', dataCbInst(keyConfig));
    }
  },
  
  getSysFileExt: function(srcPath) {
    var path = require('path');
    return path.extname(srcPath);
  },

  /**
  * 
  * Retrieves values for this request. Please use this privately.
  * 
  */
    parseCmd: function(req, res, configType, cb) {
      var sysType = req.param('sysType');
      var key = req.param('key');
      var sysConfig = sails.config.sysconfig[sysType];
      var value = req.body ? req.body.value : null;
      var cmd = {sysType:sysType, configType:configType, sysConfig:sysConfig, key:key, value:value};
      if (key != null) {
        sails.controllers.config.getSysFilePath(cmd, cb);
      }
      return cmd;
  }
};

