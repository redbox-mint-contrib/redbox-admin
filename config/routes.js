/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `config/404.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  /* No routes for now
  '/': {
    view: 'homepage'
  },*/

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  *  If a request to a URL doesn't match any of the custom routes above, it  *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/
  'GET /redbox-admin/fileHarvest/:sysType/:fileName': 'fileHarvestController.get',
  'GET /redbox-admin/fileHarvest/:sysType': 'fileHarvestController.get',
  'PUT /redbox-admin/fileHarvest/:sysType/:fileName': 'fileHarvestController.create',
  'POST /redbox-admin/fileHarvest/:sysType/:fileName': 'fileHarvestController.get',
  'DELETE /redbox-admin/fileHarvest/:sysType/:fileName': 'fileHarvestController.delete',
  'POST /redbox-admin/security/login':'securityController.login',
  'GET /redbox-admin/instance/:sysType': 'instanceController.get',
  'POST /redbox-admin/instance/:sysType': 'instanceController.start',
  'PUT /redbox-admin/instance/:sysType': 'instanceController.restart',
  'DELETE /redbox-admin/instance/:sysType': 'instanceController.stop',
  'GET /redbox-admin/config/field/:sysType/:key': 'configController.read',
  'POST /redbox-admin/config/field/:sysType/:key': 'configController.write',
  'GET /redbox-admin/config/section/:sysType': 'configController.getSection',
  'GET /redbox-admin/config/section/:sysType/:key': 'configController.getSection',
  'GET /redbox-admin/config/client': 'configController.getClientConfig',
  'POST /redbox-admin/config/section/:sysType/:key': 'configController.setSection',
  'GET /redbox-admin/config/raw/:sysType/*': 'configController.getRawFile',
  'PUT /redbox-admin/config/raw/:sysType/*': 'configController.putRawFile',
  'GET /redbox-admin/logview/get/:logFile' : 'logviewController.get',
  'GET /redbox-admin/logview/get/:logFile/:evt' : 'logviewController.get',
  'GET /redbox-admin/logview/get/:logFile/:evt/:from' : 'logviewController.get',
  'GET /redbox-admin/logview/harvester/list' : 'logviewController.harvesterList',
  'GET /redbox-admin/logview/harvester/list/:from' : 'logviewController.harvesterList',
  'GET /redbox-admin/logview/harvester/summary/:procEvt/:qryType/:hrid' : 'logviewController.harvesterSummary',
  'GET /redbox-admin/logview/harvester/summary/:procEvt/:qryType/:hrid/:from' : 'logviewController.harvesterSummary',
  'GET /redbox-admin/logview/harvester/summary/totalrecs/:hrid' : 'logviewController.harvesterTotalRecords',
  'GET /redbox-admin/workflowdef': 'WorkflowDef.getDataTypes',
  'GET /redbox-admin/workflowdef/:dataType': 'WorkflowDef.getDef',
  'GET /redbox-admin/formEditor': 'formEditor.getForms',
  'GET /redbox-admin/formEditor/:fileName': 'formEditor.getStagesList',
  'GET /redbox-admin/formEditor/:fileName/:stage': 'formEditor.getStage',
  'GET /redbox-admin/formEditor/:fileName/:stage/:section': 'formEditor.getStage',
  'PUT /redbox-admin/formEditor/:fileName/:stage': 'formEditor.updateStage',
  'PUT /redbox-admin/formEditor/:fileName/:stage/:section': 'formEditor.updateStage',
  'DELETE /redbox-admin/formEditor/:fileName/:stage': 'formEditor.removeStage',
};
