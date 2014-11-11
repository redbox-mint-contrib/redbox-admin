/**
 * LogviewController
 *
 * @description :: Server-side logic for managing logviews
 * @help        :: See http://links.sailsjs.org/docs/controllers
 * @author		:: Chris Maj
 */

module.exports = {
	


  /**
   * `LogviewController.get()`
   */
  get: function (req, res) {
	var searchFrom = req.param('from');
	var self = this;
//	self.logData;
//	self.count;
	var es = require('elasticsearch');
	var client = new es.Client({
		host: 'localhost:9200',
		log: 'trace'
	});
	client.search({
	//  index: 'twitter',
	type: 'logs',
	from: searchFrom,
	size: 20,
	_source: ["message", "logts", "evt"]
	  
	}, function(error, response){
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
   * `LogviewController.list()`
   */
  list: function (req, res) {
    return res.json({
      todo: 'list() is not implemented yet!'
    });
  }
};

