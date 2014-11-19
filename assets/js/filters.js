'use strict';

/* Filters */

angular.module('redboxAdmin.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }])
  .filter('prettyBool', [function(){
	  return function(bool){
		  var aff = ['true', '1'];
		  var neg = ['false', '0'];
		  
		  if(aff.indexOf(bool.toString().toLowerCase()) >= 0){
			  return 'Yes';
		  }else if(neg.indexOf(bool.toString().toLowerCase()) >=0){
			  return 'No';
		  }else{
			  return bool;
		  }
		  
		  
		  
	  };
  }]);
