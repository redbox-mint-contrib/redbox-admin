'use strict';

/* Filters */

angular.module('redboxAdmin.filters', [])
  .filter('removeExt', [
      function () {
          return function (name) {
              if (name) {
                  return name.split('.').shift();
              }
          }
  }])
  .filter('interpolate', ['version', function(version) {
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
