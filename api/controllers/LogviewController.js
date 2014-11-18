/**
 * LogviewController
 *
 * @description :: Server-side logic for managing logviews
 * @help        :: See http://links.sailsjs.org/docs/controllers
 * @author		:: Chris Maj
 */

module.exports = {
	
  /**
   * private 
   * `LogviewController.doSearch(qry)` 
   */
  doSearch: function(res, qry){
	   var es = require('elasticsearch');
		var client = new es.Client({
			host: 'localhost:9200',
			log: 'trace'
		});
		//TODO - if to ensure pager does not spill past the end of the recordset.sss
		client.search(qry, function(error, response){
			var jsonData = {};
			if(error){
				jsonData = {error: "There was a problem with your search."};
			}else if(response){
				jsonData = {
				    count: response.hits.total,
					logData: response.hits.hits
				};
			}else{
				jsonData = {error: "No data returned"};
			}
			
			return res.json(jsonData);
		});
   },

  /**
   * `LogviewController.get()`
   */
  get: function (req, res) {
	var searchFrom = req.param('from');
	searchFrom = searchFrom || 0;
	var searchLogType = req.param('logFile');
	var searchEvt = req.param('evt');
	searchEvt = searchEvt || "*";
	
	var query = {type: searchLogType,
	from: searchFrom,
	q: 'evt:' + searchEvt,
	size: 20,
	_source: ["message", "logts", "evt"]};
	
	sails.controllers.logview.doSearch(res, query);
  },
  
  /**
   * `LogviewController.harvesterList()`
   */
  harvesterList: function (req, res) {
	   var searchFrom = req.param('from');
	   searchFrom = searchFrom || 0;
	   var query = {type: 'mint-main',
		from: searchFrom,
		q: 'hrid_start:*',
		size: 20,
		_source: ["logts","hrid_start", "harvest_data_type"]};
	   
	   sails.controllers.logview.doSearch(res, query);
  },
  
  /**
   * `LogviewController.harvesterSummary()`
   */
  harvesterSummary: function (req, res) {
	   var searchFrom = req.param('from');
	   searchFrom = searchFrom || 0;
	   var hrid = req.param('hrid');
	   var query = {type: 'mint-main',
		from: searchFrom,
		q: 'hrid:' + hrid,
		size: 20};
	   
	   sails.controllers.logview.doSearch(res, query);
  }
};

