/**
 * FormEditorController
 *
 * @description :: Server-side logic for editing ReDBox work flow configuration file
 */

module.exports = {
  gfs: require('fs'),
  formConfsPath: sails.config.instance['redbox'].installPath + "home/form-configuration/",
  componentConfsPath: sails.config.instance['redbox'].installPath + '/portal/default/default/form-components/field-elements/',
  formSchema: "form-schema_stage.json", //Default name of schema
  getForms: function (req, res) {
    /**
     * List conf files from formConfsPath
     */
    var fl = [];
    if (module.exports.formConfsPath) {
      var fs = module.exports.gfs;
      var tfl = fs.readdirSync(module.exports.formConfsPath);
      tfl.forEach(function (f) {
        if (module.exports.isFormDef(f)) {
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
  getStagesList: function (req, res) {
    /**
     * List stages of a conf file
     */
    var confName = req.param("fileName");
    if (confName) {
      var fs = module.exports.gfs;
      var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
      var stageArray = [];
      for (stage in obj.stages) {
        stageArray.push(stage);
      }
      res.json({
        stages: stageArray
      });
    }
  },
  getStage: function (req, res) {
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
    var section = req.param("section"); // if set, individual div (section)
    var list = req.query['list'] // if set, should only list structure
    var model = module.exports.extractStage(confName, stage);

    if ('config-file' in model) {
      //if stages have config-file, load that file
      model = module.exports.readStageConf('../' + model['config-file'], true);
    }
    try {
      if (list) {
        // only list structure, filter them on server
        loaded.model.divs = [];
        for (var i = 0; i < model.divs.length; i++) {
          loaded.model.divs.push(model.divs[i]['heading']);
        }
      } else {
        // stage configuration json obj and schema are needed
        var schema_path = module.exports.formConfsPath + module.exports.formSchema;
        var fs = module.exports.gfs;
        if (fs.existsSync(schema_path)) {
          loaded.schema = module.exports.loadSchema(schema_path);
          loaded['schema_path'] = 'instance';
        } else {
          // If cannot load schema file from instance, try default
          var path = require('path')
          schema_path = path.resolve(sails.config.appPath, 'assets/extras/', module.exports.formSchema);
          if (fs.existsSync(schema_path)) {
            loaded.schema = module.exports.loadSchema(schema_path);
            loaded['schema_path'] = 'editor';
          }
        }
        // console.log("Schema path: " + schema_path);
        loaded['schema_path'] += "'s [" + schema_path + ']';

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
    } catch (e) {
      loaded['message'] = e.message;
      sails.log.error(e.message);
    }
    res.send(loaded);
  },
  removeStage: function (req, res) {
    var confName = req.param("fileName");
    var stageName = req.param("stage");

    if (confName) {
      var fs = module.exports.gfs;
      var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
      if (stageName in obj.stages) {
        delete obj.stages[stageName];
      }
      var stageArray = [];
      for (stage in obj.stages) {
        stageArray.push(stage);
      }
      EditorService.saveConf(confName, obj);
      res.json({
        stages: stageArray
      });
    } else {
      res.json({
        stages: []
      });
    }
  },
  updateStage: function (req, res) {
    var confName = req.param("fileName");
    var stageName = req.param("stage");
    var section = req.param("section"); // optional

    var fs = module.exports.gfs;
    var conf = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
    var stages_path = module.exports.isNestedConf(conf['stages']);
    var status = {
      code: 200
    };
    if (Object.keys(req.body).length === 0) {
      // add a new stage
      if (stages_path) {
        /* It needs to create a new empty stage file in sub-dirs like $stages_path
           "stageName": { "config-file": "form-configuration/$stages_path/stageName.json" }
           and tab definitions in $stages_path/tabs when details are created and then add
           {"divs": [{'config-file': $stages_path/$divs_path/div_name.json}]}
           There will be too many restrictions if it is done here. So do not do it.
        */
        status['code'] = 400;
        status['message'] = "Cannot create new stages in a nested configuration file.";
      } else {
        status = module.exports.addStage(confName, stages_path, conf, stageName)
      }
    } else {
      // update stage configuration json
      //      console.log('Update form definition using below:');
      //      console.log(JSON.stringify(req.body));
      if (stages_path) {
        if ('config-file' in conf['stages'][stageName]) {
          //if stage has config-file, load that file
          stageConf = module.exports.readStageConf('../' + conf['stages'][stageName]['config-file']);
          var divs_path = module.exports.isNestedConf(stageConf['divs']);
          if (divs_path) {
            // stages are nested, make sure stage's divs are nested
            console.log("Deeply nested as expected, smartness is needed to update " + stageName);
            status = module.exports.updateNestedDivsConf(stageConf['divs'], req.body, section);
            console.log(JSON.stringify(status));
          } else {
            status['code'] = 400;
            status['message'] = "Definition file of divs in a workflow stage has to be also in seprated files.";
          }
        } else {
          status['code'] = 400;
          status['message'] = "Key config-file was not found.";
        }
      } else {
        //console.log("Update all-in-one conf file");
        if (section) {
          //        console.log("  ----update section " + section + " of " + confName);
          //        console.log(JSON.stringify(req.body['divs'][0]));
          // {divs:[], form-layout: {}}
          // so only pick up divs
          conf['stages'][stage]['divs'][section] = req.body['divs'][0];
        } else {
          conf['stages'][stage] = req.body;
        }
        status = EditorService.saveConf(confName, conf);
        //res.json(status);
      }
    }
    res.json(status);
  },
  // below are internal functions
  isFormDef: function (f) {
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
  isNestedConf: function (confObj) {
    /* Check if this is a nested version like those used in ARMS, if yes, return path to the next level
     * Caller has to send in an object for checking:
     * Mostly there are only two levels:
     * 1. top level conf['stages']
     * 2. second level, aka stage lever, stage['divs'] - array
     */
    //    console.log('Checking if nested conf');
    //    console.log(JSON.stringify(confObj));
    if (Array.isArray(confObj)) {
      for (var i = 0; i < confObj.length; i++) {
        if ('config-file' in confObj[i]) {
          //          console.log("array path, first hit: " + JSON.stringify(confObj[i]));
          return require('path').dirname(confObj[i]['config-file']);
        }
      }
    } else {
      for (var k in confObj) {
        if ('config-file' in confObj[k]) {
          //          console.log("key path, first hit: " + JSON.stringify(confObj[k]));
          return require('path').dirname(confObj[k]['config-file']);
        }
      }
    }
    return false;
  },
  readStageConf: function (confName, deep) {
    // Load a stage conf file and its nested config-files
    //  returns a combined stage -- all its divs are inlcuded
    //    console.log("Loading stage conf JSON file: " + confName);
    var stage = JSON.parse(module.exports.gfs.readFileSync(module.exports.formConfsPath + confName));
    if (deep) {
      //      console.log("deep scan and send back merged");
      var divs = [],
        divConf = null;
      for (var i = 0; i < stage.divs.length; i++) {
        divConf = '../' + stage.divs[i]['config-file'];
        divs[i] = JSON.parse(module.exports.gfs.readFileSync(module.exports.formConfsPath + divConf));
      }
      stage.divs = divs;
    }
    return stage;
  },
  extractStage: function (confName, stageName) {
    console.log("Loading workflow JSON file: " + confName);
    var fs = module.exports.gfs;
    var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));

    if (stageName in obj.stages) {
      return obj.stages[stageName];
    } else {
      sails.log.error("Stage " + stageName + " is not in the conf file.");
      return {};
    }
  },
  addStage: function (confName, conf, stageName) {
    // Add an empty stage into an all-in-one configruation file.
    // Return stage names to caller
    var status = {
      code: 200
    };
    if (!(stageName in conf.stages)) {
      conf.stages[stageName] = {
        divs: []
      };
      EditorService.saveConf(confName, conf);
    }
    var stageArray = [];
    for (stageName in conf.stages) {
      stageArray.push(stageName);
    }
    status['stages'] = stageArray;
    return status;
  },
  loadSchema: function (fName) {
    var fs = module.exports.gfs;
    try {
      var obj = JSON.parse(fs.readFileSync(fName));
      return obj;
    } catch (e) {
      sails.log.error("Failed to load schema file: " + fName + ". More:");
      sails.log.error(e);
      throw new Error("Cannot load schema file:</br> " + e.message);
    }
  },
  loadComponentSchemas: function (componentConfsPath) {
    /* Look for *.schema.json for as the component conf
       Look for *.vm as component types
    */
    //    console.log("Sending list of component shcemas");
    var components = {},
      types = []; // types = ['debug'];
    var fs = require('fs');
    var schemaFiles = fs.readdirSync(componentConfsPath);
    schemaFiles.sort();
    for (var i = 0; i < schemaFiles.length; i++) {
      var filePath = schemaFiles[i];
      var parts = filePath.split(".");
      var l = parts.length;
      if (parts.length >= 3 && parts[l - 2] == 'schema' && parts[l - 1] == 'json') {
        console.log("Found component schema file: " + filePath);
        var cSchema = module.exports.loadSchema(module.exports.componentConfsPath + filePath);
        //                console.log(cSchema);
        components[parts[0]] = {
          "type": "object",
          "properties": null
        };
        components[parts[0]]["properties"] = cSchema.properties;
        //                console.log(JSON.stringify(components[parts[0]]["properties"]));
      } else if (parts[l - 1] == 'vm') {
        types.push(parts[0]);
        //                console.log("File: " + filePath + " is vm, does it have a schema file?");
      }
      //      components['debug'] = {"type": "object", "properties": { content: { type: 'string'} } };
    }
    return {
      confs: components,
      types: types
    };
  },
  findComponents: function () {
    var fs = require('fs');
    var rootPath = sails.config.instance['redbox'].installPath + 'portal/';
    var portalDirs = fs.readdirSync(rootPath);

    var components = {
      confs: {},
      types: []
    };

    for (var i = 0; i < portalDirs.length; i++) {
      var dirName = rootPath + portalDirs[i];
      if (fs.statSync(dirName).isDirectory()) {
        var subPortalDirs = fs.readdirSync(dirName);
        for (var j = 0; j < subPortalDirs.length; j++) {
          var subDirName = dirName + '/' + subPortalDirs[j];
          if (fs.statSync(subDirName).isDirectory()) {
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
  },
  updateNestedDivsConf: function (parentNode, newContent, section) {
    var status;
    if (section) {
      status = EditorService.saveConf(parentNode[section]['config-file'], newContent['divs'][0]);
    } else {
      for (var i = 0; i < parentNode.length; i++) {
        status = EditorService.saveConf(parentNode[i]['config-file'], newContent['divs'][i]);
      }
    }
    return status;
  }
};
