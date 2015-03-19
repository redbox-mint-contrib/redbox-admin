'use strict';

angular.module('redboxAdmin.controllers').controller('HarvestersCtrl', ['$scope', '$resource', function ($scope, $resource) {
  var resource = $resource('/redbox-admin/harvesters');
  resource.get({}, function(res){
    $scope.harvesters = res.data;
    $scope.status = res.status;
  });
}]);
