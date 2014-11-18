module.exports = {
    formConfsPath : "/opt/redbox/home/form-configuration/",
    componentConfsPath : "/opt/redbox/portal/default/default/form-components/field-elements",
    get: function(req, res) {
        console.warn("Fix path for formConfsPath: " + module.exports.formConfsPath);
//        // should be using this?
//        var sysConfig = sails.config.sysconfig;
//        console.log("Can we see the value of sysconfig?");
//        console.log(sysConfig);
        var loaded = {
            schema: {},
            model: {},
            componentSchemas: []
        };
        console.log(req.params);
        var confName = req.param("fileName");
        var stage = req.param("stage");
        loaded.model = module.exports.loadStage(confName,stage);
        loaded.schema = module.exports.loadSchema();
        loaded.componentSchemas = module.exports.loadComponentSchemas();
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
    loadSchema: function() {
        var fName = "arms_form-schema_stage.json";
        var fs = require('fs');
        try {
            var obj = JSON.parse(fs.readFileSync(module.exports.formConfsPath + fName));
            console.log("Sending schema");
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
        var components = {}, schemas = [];
        var fs = require('fs');
        var schemaFiles = fs.readdirSync(module.exports.componentConfsPath);
        schemaFiles.sort();
        for (var i = 0; i < schemaFiles.length; i++) {
            var filePath = schemaFiles[i];
            var parts = filePath.split(".");
            var l = parts.length;
            if (parts.length >= 3 && parts[l-2] == 'schema' && parts[l-1] == 'json') {
                console.log(parts[l-2] + "." + parts[l-1]);
                components[parts[0]] = filePath;
            } else if (parts[l-1] == 'vm') {
                console.log("File: " + filePath + " is vm, does it have a schema file?");
                if (!(parts[0] in components)) {
                    components[parts[0]] = 'N/A';
                }
            }
        }
        console.log(components);
        for (var k in components) {
            console.log(k);
            var obj = {};
            obj[k] =components[k];
            schemas.push(obj);
        }
        console.log(schemas);
        return schemas;
    }
};
