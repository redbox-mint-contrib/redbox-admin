module.exports = {
    formConfsPath : "/opt/redbox/home/form-configuration/",
    componentConfsPath : "/opt/redbox/portal/default/default/form-components/field-elements/",
    get: function(req, res) {
        console.warn("Fix path for formConfsPath: " + module.exports.formConfsPath);
//        // should be using this?
//        var sysConfig = sails.config.sysconfig;
//        console.log("Can we see the value of sysconfig?");
//        console.log(sysConfig);
        var loaded = {
            schema: {},
            model: {},
            supportedComponents: []
        };
        console.log(req.params);
        var confName = req.param("fileName");
        var stage = req.param("stage");
        loaded.model = module.exports.loadStage(confName,stage);
        loaded.schema = module.exports.loadSchema(module.exports.formConfsPath + "arms_form-schema_stage.json");
        var components = module.exports.loadComponentSchemas();
//        console.log(JSON.stringify(components));
        loaded.schema['properties']['divs']['items']['properties']['fields']['items']['properties']['component-confs']['properties'] = components['confs'];
        loaded.schema['properties']['divs']['items']['properties']['fields']['items']['properties']['component-type']['enum'] = components['types'];
        // Use for building conditions in a convenient and light-weight way in terms of client
        for (var k in components['confs']) {
            loaded.supportedComponents.push(k);
        }

//        console.log(JSON.stringify(loaded.schema['properties']['divs']['items']['properties']['fields']['items']['properties']['component-confs']['properties']));
//        console.log(loaded);
        res.send(loaded);
    },
    loadStage: function(confName, stage) {
        // read from config to find out what is what
        var sysConfig = sails.config.sysconfig;
        console.log("loading from " + confName);
        var fs = require('fs');
        var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + confName));

        if (stage in obj.stages) {
            console.log("Stage " + stage + " is going to be loaded.");
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
            console.log("Sending schema " + fName);
            return obj;
        } catch (e) {
            console.error("Failed to load schema file: " + fName + ". More:");
            console.error(e);
            return {};
        }
    },
    loadComponentSchemas: function() {
        console.log("Sending list of component shcemas");
        console.warn("Fix path for formConfsPath: " + module.exports.formConfsPath);
        var components = {}, types = ['debug'];
        var fs = require('fs');
        var schemaFiles = fs.readdirSync(module.exports.componentConfsPath);
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
            components['debug'] = {"type": "object", "properties": { content: { type: 'string'} } };
        }
        return {confs: components, types: types};
    }
};
