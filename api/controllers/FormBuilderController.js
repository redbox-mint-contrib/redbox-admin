/**
 * FormBuilderController
 *
 * @description :: Server-side logic for managing Formbuilders
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	


  /**
   * `FormBuilderController.get()`
   */
  get: function (req, res) {
    // TODO: configure where to find the installation of ReDBox
    var path = "/opt/redbox/home/form-configuration/";
    sails.log.info("Fixed path is used: " + path);  
    var fl = null;
    if (path) { 
      var fs = require('fs'); 
        fl = fs.readdirSync(path);
    } else {
      sails.log.debug("No path is specified.");
    };
    res.json({
            flist: fl
        });
  }
};

