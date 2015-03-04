/**
 * FormEditorController
 *
 * @description :: Server-side logic for editing ReDBox work flow configuration file
 */

module.exports = {
  gfs: require('fs'),
  formConfsPath : sails.config.instance['redbox'].installPath + "home/form-configuration/",
  componentConfsPath : sails.config.instance['redbox'].installPath + '/portal/default/default/form-components/field-elements/',
  formSchema : "form-schema_stage.json", //Default name of schema
  getForms: function (req, res) {
  /**
   * List conf files from formConfsPath
   */
    var fl = [];
    if (module.exports.formConfsPath) {
      var fs = module.exports.gfs;
      var tfl = fs.readdirSync(module.exports.formConfsPath);
      tfl.forEach(function(f) {
        if (module.exports.isFormDef(f)) {
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
    var fPath = module.exports.formConfsPath + f;
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
  },
  getStagesList:function (req, res) {
  /**
   * List stages of a conf file
   */
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
  },
  getStage: function(req, res) {
  /**
   * Get configuration of a stage
   */
    var loaded = {
      schema: {},
      model: {},
      supportedComponents: []
    };

    var confName = req.param("fileName");
    var stage = req.param("stage");
    var section = req.param("section"); // individual div (section)?
    var list = req.query['list'] // should only list structure?
    var model = module.exports.extractStage(confName,stage);

    if ('config-file' in model) {
      //if stages have config-file, load that file
      model = module.exports.loadStage('../' + model['config-file']);
    }
    try {
      if (list) {
        // only list structure, filter them on server
        loaded.model.divs = [];
        for(var i = 0; i < model.divs.length; i++) {
          loaded.model.divs.push(model.divs[i]['heading']);
        }
      } else {
        var schema_path = module.exports.formConfsPath + module.exports.formSchema;
        var fs = module.exports.gfs;
        if (fs.existsSync(schema_path)) {
          loaded.schema = module.exports.loadSchema(schema_path);
        } else {
          // If cannot load schema file from instance, try default
          var path = require('path')
          schema_path = path.resolve(sails.config.appPath, 'assets/extras/', module.exports.formSchema);
          if (fs.existsSync(schema_path)) {
            loaded.schema = module.exports.loadSchema(schema_path);
          }
        }
        // console.log("Schema path: " + schema_path);
        loaded['schema_path'] = schema_path;

        if (section) {
          loaded.model['divs'] = [];
          loaded.model.divs.push(model.divs[section]);
        } else {
          loaded.model = model;
        }
        var components = module.exports.findComponents();
        loaded.schema['properties']['divs']['items']['properties']['fields']['items']['properties']['component-confs']['properties'] = components['confs'];
        loaded.schema['properties']['divs']['items']['properties']['fields']['items']['properties']['component-type']['enum'] = components['types'].sort();
        // Use for building conditions in a convenient and light-weight way in terms of client
        for (var k in components['confs']) {
          loaded.supportedComponents.push(k);
        }
      }
    }
    catch(e) {
      loaded['message'] = e.message;
      console.error(e.message);
    }
    res.send(loaded);
  },
  // load nested files: in this file, if divs have config-file, load them
  // Saving back will be a problem, so this is just a learning process.
  loadStage: function(confName) {
    console.log("Loading workflow JSON file: " + confName);
    var stage = JSON.parse(module.exports.gfs.readFileSync(module.exports.formConfsPath + confName));
    var divs = [], divConf = null;
    for (var i=0; i<stage.divs.length; i++) {
      divConf = '../' + stage.divs[i]['config-file'];
      divs[i] = JSON.parse(module.exports.gfs.readFileSync(module.exports.formConfsPath + divConf));
    }
    stage.divs = divs;
    return stage;
  },
  extractStage: function(confName, stage) {
    console.log("Loading workflow JSON file: " + confName);
    var fs = require('fs');
    var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));

    if (stage in obj.stages) {
        return obj.stages[stage];
    } else {
        console.error("Stage " + stage + " is not in the conf file.");
        return {};
    }
  },
  loadSchema: function(fName) {
    var fs = module.exports.gfs;
    try {
      var obj = JSON.parse(fs.readFileSync(fName));
      return obj;
    } catch (e) {
      console.error("Failed to load schema file: " + fName + ". More:");
      console.error(e);
      throw new Error("Cannot load schema file:</br> " + e.message);
    }
  },
  loadComponentSchemas: function(componentConfsPath) {
    /* Look for *.schema.json for as the component conf
       Look for *.vm as component types
    */
//    console.log("Sending list of component shcemas");
    var components = {}, types = []; // types = ['debug'];
    var fs = require('fs');
    var schemaFiles = fs.readdirSync(componentConfsPath);
    schemaFiles.sort();
    for (var i = 0; i < schemaFiles.length; i++) {
      var filePath = schemaFiles[i];
      var parts = filePath.split(".");
      var l = parts.length;
      if (parts.length >= 3 && parts[l-2] == 'schema' && parts[l-1] == 'json') {
        console.log("Found component schema file: " + filePath);
        var cSchema = module.exports.loadSchema(module.exports.componentConfsPath + filePath);
//                console.log(cSchema);
        components[parts[0]] = { "type": "object", "properties": null};
        components[parts[0]]["properties"] = cSchema.properties ;
//                console.log(JSON.stringify(components[parts[0]]["properties"]));
      } else if (parts[l-1] == 'vm') {
        types.push(parts[0]);
//                console.log("File: " + filePath + " is vm, does it have a schema file?");
      }
//      components['debug'] = {"type": "object", "properties": { content: { type: 'string'} } };
    }
    return {confs: components, types: types};
  },
  updateStage:function(req, res) {
//    posted/put req.body is a stage or a section in it
//    TODO: currently only all configurations are in the same file works
    var confName = req.param("fileName");
    var stage = req.param("stage");
    var section = req.param("section"); // if section is specified

    var fs = module.exports.gfs;
    var conf = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
    var status;
    if (Object.keys(req.body).length === 0) {
//      console.log('Add an empty stage.');
      if (!(stage in conf.stages)) {
        conf.stages[stage] = {};
        EditorService.saveConf(confName, conf);
      }
      var stageArray = [];
      for(stage in conf.stages) {
        stageArray.push(stage);
      }
      res.json({ stages: stageArray });
    } else {
//      console.log('Update form definition.');
//      console.log(JSON.stringify(req.body));
      if (section) {
//        console.log("  ----update section " + section + " of " + confName);
//        console.log(JSON.stringify(req.body['divs'][0]));
        // {divs:[], form-layout: {}}
        // so only pick up divs and there is should only one
        conf['stages'][stage]['divs'][section] = req.body['divs'][0];
      } else {
//        console.log("  ----update whole file of " + confName);
        conf['stages'][stage] = req.body;
      }
//      res.json({status:200}); // for debug purpose
      status = EditorService.saveConf(confName, conf);
      res.json(status);
    }
  },
  findComponents: function() {
    var fs = require('fs');
    var rootPath = sails.config.instance['redbox'].installPath + 'portal/';
    var portalDirs = fs.readdirSync(rootPath);

    var components = {confs:{}, types: []};

    for(var i = 0; i < portalDirs.length; i++) {
      var dirName = rootPath + portalDirs[i];
      if(fs.statSync(dirName).isDirectory()) {
        var subPortalDirs = fs.readdirSync(dirName);
        for(var j=0; j < subPortalDirs.length; j++) {
          var subDirName = dirName + '/' + subPortalDirs[j];
          if(fs.statSync(subDirName).isDirectory()) {
            if (fs.existsSync(subDirName + '/form-components/field-elements')) {
              var cLists = module.exports.loadComponentSchemas(subDirName + '/form-components/field-elements');
              for (var k in cLists['confs']) {
                components['confs'][k] = cLists['confs'][k];
              }
              components['types'] = components['types'].concat(cLists['types']);
            }
          }
        }
      }
    }
    // Special treat for group element
    components['confs']['group'] = {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "type": "object",
      "properties": {
        "template": {
          "type": "string"
        },
        "fields": {
          "type": "array",
          "title": "Child fields of group component type",
          "readonly": true,
          "items": {
            "type": "object"
          }
        }
      }
    };
    components['types'].push("group");
    return components;
  }
};
