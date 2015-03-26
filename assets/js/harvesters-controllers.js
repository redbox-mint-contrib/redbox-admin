'use strict';
angular.module('redboxAdmin.controllers').controller('HarvestersCtrl', ['$scope', '$resource', '$interval', '$upload', 'redboxConfig', function ($scope, $resource, $interval, $upload, redboxConfig) {
  var resource = $resource('/redbox-admin/harvesters');
  function init() {
    resource.get({}, function(res){
      $scope.harvesters = [];
      console.log(JSON.stringify(res));
      $scope.status = res.status;
      for (var i = 0; i < res.data.length; i++) {
        $scope.harvesters.push({name: res.data[i], status: false});
        checkstatus(i);
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
        $scope.harvesters[harvestIdx].status = false;
      }
    });
  }
console.log(redboxConfig.harvestermanager.refreshInterval);
  $interval(function(){
    if ($scope.harvesters) {
      for (var i = 0; i < $scope.harvesters.length; i++) {
        checkstatus(i);
      }
    } else {
      init();
    }
  }, redboxConfig.harvestermanager.refreshInterval);

  $scope.act = function(action, harvesterInst) {
    if (! (typeof harvesterInst == 'object' && harvesterInst.hasOwnProperty('name'))) {
      throw new Error('Argument error: it has to be an object with at least name property.');
    }
//    alert("Call server for " + action + " for " + harvestId);
    var resource = $resource('/redbox-admin/harvesters/' + action);
    var args = {harvestId:harvesterInst.name};
    if (action == 'upload') {
      args['fileName'] = harvesterInst.fileName;
    }
    resource.get(args, function(res){
//      alert(JSON.stringify(res));
      if (res.status == 200) {
        if (res.hasOwnProperty("message")) {
          alert(res.message);
        } else if (res.hasOwnProperty("data")) {
          alert("Message: " + JSON.stringify(res.data));
        }
        else {
          alert("Message: " + JSON.stringify(res));
        }
        init();
      } else {
        alert("Acction failed: " + res.message);
      }
    });
  };
  $scope.uploadharvester = function($files) {
    var err_harvester_name = "Please provide a name for the new harvester: it has to be one word. Once fixed, select file again.";
    if (angular.isUndefined($scope.newHarvester)) {
      $scope.MissHarvesterName = err_harvester_name;
      return;
    }
    if (! /^[\w-_]+$/.test($scope.newHarvester)) {
      $scope.MissHarvesterName = err_harvester_name;
      return;
    }
    function rest() {
      $scope.newHarvester = "";
      document.getElementById('packagefile').value = null;
    }
    $scope.MissHarvesterName = "";
    console.log("Will upload and install it as " + $scope.newHarvester);
    for (var i = 0; i < $files.length; i++) {
      var file = $files[i];
      console.log(file);
      $scope.upload = $upload.upload({
        url: '/redbox-admin/fileHarvest/harvestermanager/'+file.name,
        method: 'PUT',
        headers: {'file-size': file.size},
        data: {},
        file: file,
        fileName: file.name
      })
      .success(function() {
        alert("Uploaded to server, will install it");
        $scope.act('upload', {name: $scope.newHarvester, fileName: file.name });
        rest();
      })
      .error(function(e) { alert("Failed to upload\n" + e); rest() });
    }
  };
}]);
