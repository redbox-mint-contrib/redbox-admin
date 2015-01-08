'use strict';

angular.module('redboxAdmin.config',[]).factory('redboxConfig', ['$http', '$rootScope', function($http, $rootScope) {
  var values = {
  };
  $http.get('/redbox-admin/config/client').success( function(data,status,headers,config) {
    for (var fld in data) {
      values[fld] = data[fld];
    }
    console.log("At config");
    console.log(values);
    $rootScope.$emit('configLoaded', values);
  }).error(function(err) {
    console.log("Error access client-side configuration");
    console.log(err);
  });  
  return values;
}]);