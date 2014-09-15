/**
 * InstanceController
 *
 * @description :: ReDBox/Mint instance controller
 * @help        :: 
 * @author      :: Shilo Banihit
 */

module.exports = {

  /**
   * `InstanceController.get()`
   *
   * Returns the status of ReDBox/Mint instances. 0 == running, otherwise instance is down.
   *
   */
  get: function (req, res) {
    var config = sails.controllers.instance.getConfig(req, res);
    sails.controllers.instance.runCmd(config.statusCmd, config, req, res);
  },
  /**
   * `InstanceController.restart()`
   *
   * Restarts the instance, returning the command's exit code.
   *
   */
  restart: function (req, res) {
    var config = sails.controllers.instance.getConfig(req, res);
    sails.controllers.instance.runCmd(config.restartCmd, config, req, res);
  },
  /**
   * `InstanceController.start()`
   *
   * Start the instance, returning the command's exit code.
   *
   */
  start: function (req, res) {
    var config = sails.controllers.instance.getConfig(req, res);
    sails.controllers.instance.runCmd(config.startCmd, config, req, res);
  },
  /**
   * `InstanceController.stop()`
   *
   * Stops the instance, returning the command's exit code.
   *
   */
  stop: function (req, res) {
    var config = sails.controllers.instance.getConfig(req, res);
    sails.controllers.instance.runCmd(config.stopCmd, config, req, res);
  },
  /**
   * `InstanceController.runCmd()`
   *
   * Convenience method, returns the exit code as response.
   *
   */
  runCmd: function(cmd, config, req, res) {
    var exec = require('child_process').exec;
    var statusProc = exec(cmd, function(error, stdout, stderr) {
      sails.log.debug(stdout);
      sails.log.debug(stderr);
    });
    statusProc.on('exit', function(code, signal) {
      return res.json({status:code});  
    });
  },
  /**
  * 
  * Retrieves configuration for this request 
  * 
  */
  getConfig: function(req, res) {
    var sysType = req.param('sysType');
    var statusCmd = sails.config.instance[sysType].statusCmd;
    var restartCmd = sails.config.instance[sysType].restartCmd;
    var stopCmd = sails.config.instance[sysType].stopCmd;
    var startCmd = sails.config.instance[sysType].startCmd;
    return {sysType:sysType, statusCmd:statusCmd, restartCmd:restartCmd, stopCmd:stopCmd, startCmd:startCmd};
  }
}