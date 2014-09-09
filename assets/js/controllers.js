'use strict';

/* Controllers */

angular.module('redboxAdmin.controllers', ['angularFileUpload','ui.bootstrap','redboxAdmin.config'])
  .controller('IndexCtrl', ['$scope', '$routeParams', '$location', 'authService', '$http', function($scope, $routeParams, $location, authService, $http) {
    $scope.$http = $http;
    $scope.getStat = function($event) {
        console.log("Getting Instance status:");
    };
  }])
    .controller('LogoutCtrl', ['$scope', '$routeParams', '$location', 'authService','$http','redboxConfig', function($scope, $routeParams, $location, authService, $http, redboxConfig)   {
  	authService.deleteAuth();
    $http.post(redboxConfig.authOutUrl, 'verb=logout', {headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}}).success(function() {console.log("Logged out."); $location.path("/").replace();});
  }])
    .controller('MintCsvCtrl',  [ '$scope', '$upload', '$resource', function($scope, $upload, $resource) {
      $scope.mintPendingFiles = [];
      var FileHarvest = $resource('/redbox-admin/fileHarvest/:sysType/:fileName', {sysType:'@sysType', fileName:'@fileName'});
      // -----------------------------------------------------------
      // Getting Mint File list
      // -----------------------------------------------------------  
      $scope.getMintPendingFileList = function() {
          var list = FileHarvest.get({sysType:'mint'}, function(){
            $scope.mintPendingFiles = list.files;
          });
      };
      // -----------------------------------------------------------
      // Misc. UI related bindings
      // -----------------------------------------------------------
      $scope.fileUploads = [];
      $scope.mainUploadNum = null;
      $scope.alert = {msg:null, def_cl:'alert alert-danger',ok_cl:'alert alert-success',warn_cl:'alert alert-warning', type:'success'};
      $scope.closeAlert = function() {
        $scope.alert.msg = null;
        $scope.alert.cl = $scope.alert.def_cl;
        $scope.fileUploads.splice(0, $scope.fileUploads.length);
      };
      // -----------------------------------------------------------
      // Uploading Mint CSV files...
      // -----------------------------------------------------------
      $scope.progCbHdlr = function(fileUpload) {
        return function(evt) {
          fileUpload.prog = parseInt(100.0 * evt.loaded / evt.total);
        };
      };
      $scope.checkUploads = function() {
        var success = true;
        var errored = false;
        var numerror = 0;
        for (var j=0; j < $scope.fileUploads.length; j++) {
          var fileUpload = $scope.fileUploads[j];
          if (fileUpload.prog < 100) {
            success = false;
          } else if (fileUpload.errored) {
            errored = true;
            fileUpload.cl = fileUpload.nok_cl;
            numerror++;
          } else {
            fileUpload.cl = fileUpload.ok_cl;
          }
        }
        if (success && !errored) {
          $scope.alert.cl = $scope.alert.ok_cl;
          $scope.alert.msg = $scope.fileUploads.length + " file(s) uploaded.";
          $scope.getMintPendingFileList();
        } else if (errored) {
          $scope.alert.type = 'warning';
          $scope.alert.cl = $scope.alert.warn_cl;
          $scope.alert.msg = $scope.fileUploads.length - numerror + " file(s) uploaded, " + numerror + " failed.";
          $scope.getMintPendingFileList();
        }
      };
      $scope.nokCbHdlr = function(fileUpload) {
        return function(data, status, headers, config) {
            fileUpload.errored = true;
            $scope.checkUploads();
        };
      };
      $scope.getProgTracker = function(file) {
        var tracker = {lbl:file.name,prog:0,fileName:file.name,def_cl:'progress-bar progress-bar-striped active',ok_cl:'progress-bar progress-bar-success progress-bar-striped', nok_cl:'progress-bar progress-bar-danger progress-bar-striped'};
        tracker.cl = tracker.def_cl;
        return tracker;
      };
      $scope.onMintFileSelect = function($files) {
        //$files: an array of files selected, each file has name, size, and type.
        $scope.closeAlert();
        for (var i = 0; i < $files.length; i++) {
          var file = $files[i];
          var progTracker = $scope.getProgTracker(file);
          $scope.fileUploads.push(progTracker);
          var progHdlr = $scope.progCbHdlr(progTracker);
          var nokHdlr = $scope.nokCbHdlr(progTracker);
          $scope.upload = $upload.upload({
            url: '/redbox-admin/fileHarvest/mint/'+file.name,
            method: 'POST',
            headers: {'file-size': file.size},
            //withCredentials: true,
            data: {},
            file: file, // or list of files ($files) for html5 only
            fileName: file.name,
            // customize file formData name ('Content-Disposition'), server side file variable name. 
            //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file' 
            // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
            //formDataAppender: function(formData, key, val){}
          })
          .progress(progHdlr)
          .success($scope.checkUploads)
          .error(nokHdlr);
          //.then(success, error, progress); 
          // access or attach event listeners to the underlying XMLHttpRequest.
          //.xhr(function(xhr){xhr.upload.addEventListener(...)})
        }
        /* alternative way of uploading, send the file binary with the file's content-type.
           Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed. 
           It could also be used to monitor the progress of a normal http post/put request with large data*/
        // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
      };
      // -----------------------------------------------------------
      // Delete a pending CSV File
      // -----------------------------------------------------------
      $scope.deleteFile = function(fileName) {
        var stat = FileHarvest.delete({sysType:'mint', fileName:fileName}, function(){
            $scope.getMintPendingFileList();
        });
      };
    }]);
