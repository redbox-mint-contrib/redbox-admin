module.exports = {
  formConfsPath : sails.config.instance['redbox'].installPath + "home/form-configuration/",
  componentConfsPath : sails.config.instance['redbox'].installPath + '/portal/default/default/form-components/field-elements/',
  formSchema : "arms_form-schema_stage.json",
  get: function(req, res) {
    var loaded = {
      schema: {},
      model: {},
      supportedComponents: []
    };

    var confName = req.param("fileName");
    var stage = req.param("stage");
//    console.log("loading " + confName + " " + stage);
    loaded.model = module.exports.loadStage(confName,stage);
//    console.log("schema path: " + module.exports.formConfsPath + module.exports.formSchema);
    loaded.schema = module.exports.loadSchema(module.exports.formConfsPath + module.exports.formSchema);
    var components = module.exports.findComponents();
    loaded.schema['properties']['divs']['items']['properties']['fields']['items']['properties']['component-confs']['properties'] = components['confs'];
    loaded.schema['properties']['divs']['items']['properties']['fields']['items']['properties']['component-type']['enum'] = components['types'].sort();
    // Use for building conditions in a convenient and light-weight way in terms of client
    for (var k in components['confs']) {
      loaded.supportedComponents.push(k);
    }

    res.send(loaded);
  },
  loadStage: function(confName, stage) {
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
    var fs = require('fs');
    try {
        var obj = JSON.parse(fs.readFileSync(fName));
        return obj;
    } catch (e) {
        console.error("Failed to load schema file: " + fName + ". More:");
        console.error(e);
        return {};
    }
  },
  loadComponentSchemas: function(componentConfsPath) {
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
        console.log(parts[l-2] + "." + parts[l-1]);
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
  write:function(req, res) {
//    posted req.body is a stage
    var confName = req.param("fileName");
    var stage = req.param("stage");

    var fs = require('fs');
    var conf = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));
    conf['stages'][stage] = req.body;

    confName = module.exports.formConfsPath + 'new_' + confName;
    console.warn("File is saved to a new name for testing:" + confName);
    fs.writeFile(confName, JSON.stringify(conf), function (err) {
        if (err) {
            console.error("Faile to save form definition file");
            res.send(400, "Failed to save.");
        } else { res.send(200); }
    });
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
    return components;
  }
};
