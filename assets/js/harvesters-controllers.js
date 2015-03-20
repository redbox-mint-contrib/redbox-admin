'use strict';

angular.module('redboxAdmin.controllers').controller('HarvestersCtrl', ['$scope', '$resource', '$interval', function ($scope, $resource, $interval) {
  var resource = $resource('/redbox-admin/harvesters');
  function init() {
    resource.get({}, function(res){
      $scope.harvesters = [];
      $scope.status = res.status;
      for (var i = 0; i < res.data.length; i++) {
        $scope.harvesters.push({name: res.data[i], status: 'false'});
      }
    });
  }
  init();
  function checkstatus(harvestIdx) {
    var resource = $resource('/redbox-admin/harvesters/isStarted');
    resource.get({harvestId:$scope.harvesters[harvestIdx].name}, function(res){
      if (res.status == 200) {
//        console.log(JSON.stringify(res.data));
        $scope.harvesters[harvestIdx].status = res.data.started;
      } else {
        $scope.harvesters[harvestIdx].status = 'false';
      }
    });
  }
  $interval(function(){
    if ($scope.harvesters) {
      for (var i = 0; i < $scope.harvesters.length; i++) {
        checkstatus(i);
      }
    } else {
      init();
    }
  }, 5000);

  $scope.act = function(action, harvesterInst) {
//    alert("Call server for " + action + " for " + harvestId);
    var resource = $resource('/redbox-admin/harvesters/' + action);
    resource.get({harvestId:harvesterInst.name}, function(res){
//      alert(JSON.stringify(res));
      if (res.status == 200) {
        if (res.data.hasOwnProperty("message")) {
          alert(res.data.message);
        }
//        else {
//          alert(JSON.stringify(res.data));
//        }
      } else {
        alert("Acction failed: " + JSON.stringify(res.data));
      }
    });
  };
}]);
