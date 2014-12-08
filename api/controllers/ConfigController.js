/**
 * ConfigController
 *
 * @description :: Server-side logic for managing configs
 * @help        :: See http://links.sailsjs.org/docs/controllers
 * @author      :: Shilo Banihit
 */

module.exports = {

  /**
   *
   * `ConfigController.read()` - api for reading blocks or specific entries of configuration.
   *
   */
  read: function (req, res) {
    sails.controllers.config.getValue(sails.controllers.config.parseCmd(req, res, 'field'), res);
  },
  /**
   *
   * `ConfigController.write()` - api for writing blocks or specific entries of configuration.
   *
   */
  write: function (req, res) {
    var cmd = sails.controllers.config.parseCmd(req, res, 'field');
    sails.controllers.config.putValue(cmd, res);
  },    
  /**
  *
  *  `ConfigController.getSection()` - api for retrieving configurable sections
  *
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
    } else {
      // returns the schemas
      var subsections = [];
      var defaultForm = ["*"]; // TODO: retrieve from config
      sails.controllers.config.parseCmd(req, res, 'section', function(cmd) {
        var returnSec = function() {
          var addedCtr = 0;
          return function() {
            addedCtr++;
            if (addedCtr == cmd.subsectionLen) {
              return res.json({id:cmd.key, subsections:subsections});
            }
          }
        }();
        for (var keyConfig in cmd.keyConfigs) {
          // check if this section is a directory that must be walked...
          if (cmd.keyConfigs[keyConfig].schemaData_nosupport && cmd.keyConfigs[keyConfig].srcData_nosupport) {
            cmd.subsectionLen--;
            var fs = require('fs');
            var dir = cmd.keyConfigs[keyConfig].srcPath;
            // walk the directory...
            fs.readdir(dir, function(err, files) {
              if (err) {
                sails.log.error("Error walking directory:" + dir);
                sails.log.error(err);
                return;
              }
              // executed as each file is read...
              var fileReadCb = function() {
                var ctr=0;
                return function() {
                  ctr++;                
                  if (ctr == files.length) {
                    returnSec();
                  }
                };
              }();
              var loadFunc = function(filePath) {
                var file = {};
                cmd.subsectionLen++;
                // load the contents of the file
                sails.controllers.config.readFile(dir + filePath, true, file, 'data', function() {
                  var model = file.data;
                  // schema will adjust to deal with JSON that starts with a top-level array...
                  var schemaData = sails.controllers.config.createSchema(model);
                  if (schemaData.injectedWrapper) {
                    var newmodel = {};
                    newmodel[schemaData.injectedWrapper] = model;
                    model = newmodel;
                  }
                  // add the subsection...
                  subsections.push({id:filePath, 
                            schema: schemaData, 
                            form: defaultForm, 
                            model: model,
                            title:filePath});   
                  returnSec();
                });
              };
              for (var i=0; i<files.length; i++) {
                var filePath = files[i];
                var fileExt = sails.controllers.config.getSysFileExt(filePath);
                // files become the subsections
                // we only support .properties and .json files
                if (fileExt == ".properties" || fileExt == ".json") {
                  loadFunc(filePath);
                }
              }
            });
          } else {
            var subsection = {id:cmd.keyConfigs[keyConfig].source, 
                              schema: cmd.keyConfigs[keyConfig].schemaData, 
                              form: cmd.keyConfigs[keyConfig].form ? cmd.keyConfigs[keyConfig].form : defaultForm, 
                              model: cmd.keyConfigs[keyConfig].srcData,
                             title:cmd.keyConfigs[keyConfig].title };
            subsections.push(subsection);   
            returnSec();
          }
        }
      });
    }
  },
  /**
  *
  *  `ConfigController.setSection()` - api for saving a configurable section
  *
  */
  setSection: function(req, res) {
    var sectionName = req.param('key');
    if (sectionName == null) {
      return res.send(400, "No section name");
    }
    sails.controllers.config.parseCmd(req, res, 'section', function(cmd) {
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
      var getDataFn = function(srcId, srcPath, model, cmd) {
        var dataObj = undefined;
        var ext = sails.controllers.config.getSysFileExt(srcPath);
        sails.log.debug("getDataFn - " + ext);
        if (ext == '.json') {
          sails.log.debug("getDataFn - JSON");
          dataObj = {str: JSON.stringify(model, null, "\t"), path: srcPath};
        } else if (ext == '.properties') {
          sails.log.debug("getDataFn - Prop");
          var properties = require('properties');
          dataObj = {str:properties.stringify(model, {unicode:true}), path: srcPath};
        } else if (ext == ".less") {
          sails.log.debug("getDataFn - Less");
          var lessData = "";
          for (fld in model) {
            lessData += fld + ": " + model[fld] + ";\r\n";
          }
          dataObj = {str:lessData, path:srcPath};
        } else if (ext == ".png") {
          sails.log.debug("getDataFn - PNG");
          dataObj = {str:null, path:srcPath};
        } else {
          // must be a directory
          var newPath = srcPath + srcId;
          sails.log.debug("getDataFn - Newpath:" + newPath);
          dataObj = getDataFn(srcId, newPath, model, cmd);
        }
        return dataObj;
      };
      var writeCbFn = function(sourceId, srcPath, model, schema, cmd) {
        var ext = sails.controllers.config.getSysFileExt(srcPath);
        return function() {
          // validate section data... if there's a schema
          var result = null;
          if (schema.data) {
            result = tv4.validateMultiple(model, schema.data);
          }
          // save the section...
          if ((schema.data && result!=null && result.valid == true) || (schema.data == null)) {
            // check if we have an injected wrapper: workaround with JSON top-level array
            if (schema.injectedWrapper) {
              // remove the wrapper...
              model = model[schema.injectedWrapper];
            }
            sails.log.debug("Writing to file: " + srcPath);
            sails.log.debug(model);
            var dataObj = getDataFn(sourceId, srcPath, model, cmd);
            var writeOkHdlr = cmd.keyConfigs[sourceId].srcConfig.onWriteSuccess;
            if (writeOkHdlr) {
              cb = sails.controllers.config[writeOkHdlr](rbSection, res, cmd.keyConfigs[sourceId].srcConfig, cmd);
            }
            if (dataObj.str) {
              sails.controllers.config.writeFile(dataObj.path, dataObj.str, cb, function() { res.send(400, "Error writing to one of the files");});
            } else {
              // assume its binary..
              sails.log.debug("Ignoring binary field");
              cb();
            }
          } else {
            sails.log.error("Failed to validate model with schema:"+srcPath);
          }
        }
      };
      for (var i=0; i<rbSection.subsections.length; i++) {
        var sourceId = rbSection.subsections[i].id;
        var srcPath = (cmd.keyConfigs[sourceId] ? cmd.keyConfigs[sourceId].srcPath : cmd.keyConfigs[rbSection.id].srcPath );
        var schemaPath = (cmd.keyConfigs[sourceId] ? cmd.keyConfigs[sourceId].schemaPath : cmd.keyConfigs[rbSection.id].schemaPath);
        var schema = cmd.keyConfigs[sourceId] ? {} : rbSection.subsections[i].schema;
        var writeCb = writeCbFn(sourceId, srcPath, rbSection.subsections[i].model, schema, cmd, cb);
        cmd.keyConfigs[sourceId] ? sails.controllers.config.readFile(schemaPath, true, schema, 'data', writeCb) : writeCb();
      }
    });
  },
  /**
  *
  *  `ConfigController.createSchema()` - quick and dirty function to generate a JSON Schema from a model, not a complete implementation.
  *
  */
  createSchema: function(data) {
    var schema = {type:"object", $schema: "http://json-schema.org/draft-03/schema", required:false, properties:{} };
    var parseFld = function(prop, fld, val) {
      if (typeof val == "string" || val == null) {
        prop[fld] = {type:"string", required:false};
      } else if (Array.isArray(val)) {
        prop[fld] = {type:"array", required:false, items:{}};
        // a peek at the first entry...
        var sampleEntry = val[0];
        if (typeof sampleEntry == "string") {
          prop[fld].items.type = "string";
          prop[fld].items.required = false;
        } else {
          prop[fld].items.type = "object";
          prop[fld].items.properties = {}
          for (var fldEntry in sampleEntry) {
            parseFld(prop[fld].items.properties, fldEntry, sampleEntry[fldEntry]);
          }
        }
      } else {
        if (!prop.properties) prop.properties = {};
        prop.properties[fld] = {type:"object",required:false};
        // iterate through its fields...
        for (var nestedFld in val) {
          parseFld(prop.properties[fld], nestedFld, val[nestedFld]);
        }
      }
    };
    var prop = schema.properties;
    // JSON top-level array workaround: we check if this is an array because JSON-Schema seems not able to handle a top-level array instead of an object
    if (Array.isArray(data)) {
      schema.injectedWrapper = "arrayItem";
      prop[schema.injectedWrapper] = {type:'array', required:false, items:{type:'object', required:false, properties:{}}};
      prop = prop[schema.injectedWrapper].items.properties;
      // examine first entry only, assume other elements have same fields
      data = data[0]; 
    } 
    for (var fld in data) {
      parseFld(prop, fld, data[fld]);
    }
    
    return schema;
  },
  /**
  *
  *  `ConfigController.readFile()` - reads the contents of a file. The contents can parsed into a JSON object or remain as a string.
  *   The contents of the file will be set as a property of the 'target' object, using the 'field' parameter. 
  *   If a 'cb' is set, it will be executed.
  *
  */
  readFile: function(path, parse, target, field, cb) {
    var setData = function(data, rawdata) {
      if (parse) {
        target[field] = JSON.parse(data);
      } else {
        target[field] = data;
      }
      if (rawdata) target[field+'_raw'] = rawdata;
      if (cb) { 
        cb();
      }
    };
    sails.log.debug("Attempting to load: " + path);
    if (path) {
      var fs = require('fs'); 
      var ext = sails.controllers.config.getSysFileExt(path);
      if (ext == ".json") {
        fs.readFile(path, {flags:'r', encoding:'UTF-8'}, function(err, data) {setData(data)});  
      } else if (ext == ".properties") {
        fs.readFile(path, {flags:'r', encoding:'UTF-8'}, function(err, propStr) {
          // convert properties to json...
          var properties = require('properties');
          properties.parse(propStr, {}, function(error, propObj){
            if (error) {
              sails.log.error("Error parsing properties file.")
              sails.log.error(error);
              setData(null);
              return;
            }
            parse = false;
            setData(propObj);
          });
        });  
      } else if (ext == ".less") {
        // TODO: due to very tight time contraints, we'll just have to use a primitive less to JSON parser
        fs.readFile(path, {flags:'r', encoding:'UTF-8'}, function(err, data) {
          if (err) {
            sails.log.error("Error reading less file:"+path);
            return;
          } else {
            var lessLines = data.match(/[^\r\n]+/g);
            var jsonData = {};
            for (var j=0; j<lessLines.length; j++) {
              var lessData = lessLines[j].split(":");
              jsonData[lessData[0].replace(" ","")] = lessData[1].replace(" ", "").replace(";","");
            }
            parse = false;
            setData(jsonData, data);
          }
        });
      } else if (ext == ".png") {
        parse = false;
        setData({imgPath:sails.config.contextName+"config/raw/"+target.sysType+"/"+path.replace(sails.config.instance[target.sysType].installPath, "")});
      } else {
        sails.log.debug("Unsupported, unknown file extenstion: " + ext);
        // Unsupported file, do nothing, callers can deal with it.
        target[field+'_nosupport'] = true;
        setData(null);
      }
    } else {
      sails.log.debug("Unsupported, no path specified");
      // path not specified...
      target[field+'_nosupport'] = true;
      setData(null);
    }
  },
  /**
  *
  *  `ConfigController.writeFile()` - writes a string to a file. If 'cb' is set, it will be executed on success.
  *   Otherwise if 'errCb' is set, it will be executed.
  *
  */
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
  /**
  *
  *  `ConfigController.returnJson()` - writes a JSON key value pair in the response.
  *
  */
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
  /**
  * 
  * `ConfigController.getSysFiles()` - loads configuration and file data.
  * 
  */
  getSysFiles: function(cmd, cb) {
    cmd.keyConfigs = {};
    var jsonDataCb = function(subSecCnt) {
      var subSecCtr = 0;
      return function(keyConfig) {
        return function() {
          if ((keyConfig.schemaData && keyConfig.srcData) || (keyConfig.schemaData_nosupport && keyConfig.srcData_nosupport)) {
            subSecCtr++;
            if (subSecCtr==subSecCnt) {
              cb(cmd);
            }
          }
        }
      };
    };
    var readSysFiles = function(keyConfig, cb) {
      sails.controllers.config.readFile(keyConfig.schemaPath, true, keyConfig, 'schemaData', function() {
        sails.controllers.config.readFile(keyConfig.srcPath, true, keyConfig, 'srcData', function() {
          cb();
        });
      });
    };
    var dataCbInst = jsonDataCb(cmd.sysConfig[cmd.configType][cmd.key].subsections.length);
    cmd.subsectionLen = cmd.sysConfig[cmd.configType][cmd.key].subsections.length;
    for (var i=0; i<cmd.subsectionLen; i++) {
      var keyConfig = cmd.sysConfig[cmd.configType][cmd.key].subsections[i];
      keyConfig.srcPath = sails.config.instance[cmd.sysType].installPath + cmd.sysConfig.source[keyConfig.source].path;
      keyConfig.schemaPath =  sails.config.instance[cmd.sysType].installPath + cmd.sysConfig.source[keyConfig.source].schema;
      keyConfig.srcExt = sails.controllers.config.getSysFileExt(keyConfig.srcPath);
      keyConfig.srcConfig = cmd.sysConfig.source[keyConfig.source];
      keyConfig.sysType = cmd.sysType;
      cmd.keyConfigs[keyConfig.source] = keyConfig;
      // read the schema then the data
      readSysFiles(keyConfig, dataCbInst(keyConfig));
    }
  },
  /**
  * 
  * Returns the path's extension. 
  *
  * TODO: revisit in the future if this needs to return a more richer object.
  * 
  */
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
        sails.controllers.config.getSysFiles(cmd, cb);
      } else {
        return cmd;
      }
  },
  /**
   * `ConfigController.runCmd()`
   *
   * Convenience method, passes the exit code to cb (if not null)
   *
   */
  runCmd: function(cmd, cb) {
    var exec = require('child_process').exec;
    var statusProc = exec(cmd, function(error, stdout, stderr) {
      sails.log.debug(stdout);
      sails.log.debug(stderr);
    });
    statusProc.on('exit', function(code, signal) {
      if (cb) {
        cb(code);
      } 
    });
  },
  /**
  * `ConfigController.compileLess()`
  *  
  * Callback called after saving a less file.
  */
  compileLess: function(rbSection, res, srcConfig, cmd) {
    var ctr = 0;
    return function() {
      ctr++;
      if (ctr == rbSection.subsections.length) {
        sails.log.debug("Running less compiler");
        var lesscmd = "lessc --include-path=" + srcConfig.compileIncludePath + " " + srcConfig.compileSource + " " + srcConfig.compileTarget;
        sails.log.debug(lesscmd);
        sails.controllers.config.runCmd(lesscmd, function(code) {
          sails.log.debug("Less compiler exit code:" + code);
          // changing versions...
          var sysConfigData = {};
          var sysConfigPath = sails.config.instance[cmd.sysType].installPath+'home/system-config.json';
          sails.controllers.config.readFile(sysConfigPath, true, sysConfigData, 'json', function(){
            var curVer = sysConfigData.json['version.string'];
            if (curVer) {
              var subVers = curVer.split("_");
              if (subVers.length > 1 && subVers[1] !== null) {
                curVer = subVers[0] + "_" + (parseInt(subVers[1], 10) + 1);
              } else {
                curVer = subVers[0] + "_1";
              }
              sails.log.debug("New version:" + curVer);
              sysConfigData.json['version.string'] = curVer;
              sails.controllers.config.writeFile(sysConfigPath, JSON.stringify(sysConfigData.json, null, " "), function() {
                sails.log.debug("System config updated with new version");
                return res.json(rbSection);      
              }, function() {
                sails.log.error("Failed to update system config with new version");
              });
            }
          }); 
          
        });
      }
    }
  },
  
  getRawFile: function(req, res) {
    var sysType = req.param('sysType');
    var filePath = req.params[0];
    var absFilePath = sails.config.instance[sysType].installPath + filePath;
    var options = {
      lastModified:false
    };
    if (absFilePath.lastIndexOf('.png') > 0) {
      var fs = require('fs');
      fs.readFile(absFilePath, {flags:'r', encoding:'binary'}, function(err, data) {
        if (err) {
          sails.log.error("Error sending file in base64: " + absFilePath);
          return res.send(404, "File does not exist/converting to base64");
        }
        var base64 = "data:image/png;base64,"+new Buffer(data, 'binary').toString('base64');
        return res.send(base64);
      });     
    } else {
      res.sendfile(absFilePath, options, function (err) {
        if (err) {
          sails.log.error("Error sending file: " + absFilePath);
          return res.send(404, "File does not exist.");
        }
      });
    }
  },
  
  putRawFile: function(req, res) {
    sails.log.debug("Putting Raw file");
    var fs = require('fs');
    var sysType = req.param('sysType');
    var filePath = req.params[0];
    var absFilePath = sails.config.instance[sysType].installPath + filePath;
    req.file('file').upload({maxBytes:100000000}, function(err, files) {
      if (err) {
        sails.log.error(err);
        return res.send(400, "Error uploading file.");
      }
      // copy the file(s) to the target directory...
      sails.log.debug("Receiving files, number: " + files.length);
      for (var i=0; i<files.length; i++) {
          try {
            fs.renameSync(files[i].fd, absFilePath);
            fs.chmod(absFilePath, 0775);
          } catch (err) {
            sails.log.error("Error moving file to " + absFilePath + ": " + err);
            return res.send(400, "Error moving file to target directory:" + err);
          }
      }
      return res.json({
        message: files.length + " file(s) uploaded successfully",
        files: files
      });
    });
  }
};

