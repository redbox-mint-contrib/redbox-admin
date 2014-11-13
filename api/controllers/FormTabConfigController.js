module.exports = {
    formConfsPath : "/opt/redbox/home/form-configuration/",
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
        return []; 
    }
};