'use strict';

// -----------------------------------------------------------
// ReDBox / Mint administration app AngularJS Controllers
//
// author: Shilo Banihit
// -----------------------------------------------------------

angular.module('redboxAdmin.controllers', ['angularFileUpload', 'ui.bootstrap', 'schemaForm', 'ngRoute', 'angularModalService'])
  // -----------------------------------------------------------
  // IndexCtrl
  //  - does nothing but an index, for now
  // -----------------------------------------------------------
  .controller('IndexCtrl', ['$scope', '$routeParams', '$location', 'authService', '$http', '$resource', 'authWatcher', function($scope, $routeParams, $location, authService, $http, $resource, authWatcher) {
    authWatcher.addExpiryChecker($scope);
  }])
  // -----------------------------------------------------------
  // InstanceCtrl
  //  - controls RB/Mint instance
  // -----------------------------------------------------------
  .controller('InstanceCtrl', ['$scope', '$routeParams', '$location', 'authService', '$http', '$resource', '$route', '$interval', 'redboxConfig', 'modalDiag', 'authWatcher', function($scope, $routeParams, $location, authService, $http, $resource, $route, $interval, redboxConfig, modalDiag, authWatcher) {
    authWatcher.addExpiryChecker($scope);
    $scope.$http = $http;
    var Instance = $resource('/redbox-admin/instance/:sysType', {
      sysType: '@sysType'
    }, {
      get: {
        method: 'GET'
      },
      restart: {
        method: 'PUT'
      },
      start: {
        method: 'POST'
      },
      stop: {
        method: 'DELETE'
      }
    });
    $scope.redbox = {
      sysType: 'redbox',
      pending: false,
      stat: 5,
      lastChecked: 'n/a',
      cmdDisabled: false,
      STAT_UP: 0,
      STAT_STOPPING: 1,
      STAT_DOWN: 2,
      STAT_STARTING: 3,
      STAT_RESTARTING: 4,
      STAT_REFRESHING: 5
    };
    $scope.mint = {
      sysType: 'mint',
      pending: false,
      stat: 5,
      lastChecked: 'n/a',
      refreshDisabled: false,
      STAT_UP: 0,
      STAT_STOPPING: 1,
      STAT_DOWN: 2,
      STAT_STARTING: 3,
      STAT_RESTARTING: 4,
      STAT_REFRESHING: 5
    };
    var statWatcher = function(sys) {
      return function() {
        switch (sys.stat) {
          case sys.STAT_DOWN:
            sys.panelCl = 'panel-danger';
            sys.titleSfx = 'is stopped';
            break;
          case sys.STAT_UP:
            sys.panelCl = 'panel-success';
            sys.titleSfx = 'is running';
            break;
          case sys.STAT_STOPPING:
            sys.panelCl = 'panel-warning';
            sys.titleSfx = 'is stopping...hold on.';
            break;
          case sys.STAT_STARTING:
            sys.panelCl = 'panel-warning';
            sys.titleSfx = 'is starting...hold on.';
            break;
          case sys.STAT_RESTARTING:
            sys.panelCl = 'panel-warning';
            sys.titleSfx = 'is restarting...hold on.';
            break;
          default:
            sys.panelCl = 'panel-warning';
            sys.titleSfx = 'status is unknown.';
            break;
        }
      };
    };
    $scope.$watch('redbox.stat', statWatcher($scope.redbox));
    $scope.$watch('mint.stat', statWatcher($scope.mint));
    $scope.runCmd = function(sysType, cmd, interimStat, runCmdCb) {
      // TODO: when restarting RB, make sure token does not expire 'soon'...
      var cb = function(sysType, cmd) {
        return function(confirm) {
          if (confirm == 'Yes') {
            if ($scope[sysType].pending == true) {
              console.log("Command canceled:" + sysType + "." + cmd + ", there is a pending command.");
              return;
            }
            $scope[sysType].cmdDisabled = true;
            $scope[sysType].stat = interimStat;
            var stat = Instance[cmd]({
              sysType: sysType
            }, function() {
              $scope[sysType].stat = stat.status;
              $scope[sysType].lastChecked = new Date();
              $scope[sysType].cmdDisabled = false;
              $scope[sysType].pending = false;
              if (runCmdCb) runCmdCb();
            });
          }
        };
      };
      if (cmd != 'get') {
        modalDiag.showModal('confirm.html', 'static', cb(sysType, cmd));
      } else {
        cb(sysType, cmd)('Yes');
      }
    };
    $scope.currentSysType = $route.current.params.sysType;
    if ($scope.currentSysType != null) {
      $scope.runCmd($scope.currentSysType, 'restart', $scope[$scope.currentSysType].STAT_RESTARTING, function() {
        $location.path("/instance").replace();
      });
    }
    $scope.refreshPromise = undefined;
    var statRefresh = function() {
      if (angular.isDefined($scope.refreshPromise)) {
        console.log("Not refreshing status, there is a pending request.");
        return;
      }
      $scope.refreshPromise = $interval(function() {
        $scope.runCmd('redbox', 'get');
        $scope.runCmd('mint', 'get');
      }, redboxConfig.instance.refreshInterval);
    };
    console.log("Starting refresh timeout...");
    statRefresh();
    $scope.$on('$destroy', function() {
      if (angular.isDefined($scope.refreshPromise)) {
        $interval.cancel($scope.refreshPromise);
        $scope.refreshPromise = undefined;
      }
    });
  }])
  // -----------------------------------------------------------
  // LogutCtrl
  //  - logs out the user: deletes the local token and logs out the user in RB
  // -----------------------------------------------------------
  .controller('LogoutCtrl', ['$scope', '$routeParams', '$location', 'authService', '$http', 'redboxConfig', function($scope, $routeParams, $location, authService, $http, redboxConfig) {
    authService.deleteAuth();
    $http.post(redboxConfig.auth.outUrl, 'verb=logout', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    }).success(function() {
      console.log("Logged out.");
      $location.path("/").replace();
    });
  }])
  // -----------------------------------------------------------
  // MintCsvCtrl
  // - allows access, deletion and uploading of MInt CSV files
  // -----------------------------------------------------------
  .controller('MintCsvCtrl', ['$scope', '$upload', '$resource', 'redboxConfig', 'authService', 'authWatcher', function($scope, $upload, $resource, redboxConfig, authService, authWatcher) {
    authWatcher.addExpiryChecker($scope);
    $scope.jws = authService.getJws();
    $scope.mintPendingFiles = [];
    var FileHarvest = $resource('/redbox-admin/fileHarvest/:sysType/:fileName', {
      sysType: '@sysType',
      fileName: '@fileName'
    });
    // -----------------------------------------------------------
    // Getting Mint File list
    // -----------------------------------------------------------
    $scope.getMintPendingFileList = function() {
      var list = FileHarvest.get({
        sysType: 'mint'
      }, function() {
        $scope.mintPendingFiles = list.files;
      });
    };
    // -----------------------------------------------------------
    // Misc. UI related bindings
    // -----------------------------------------------------------
    $scope.fileUploads = [];
    $scope.mainUploadNum = null;
    $scope.alert = {
      msg: null,
      def_cl: 'alert alert-danger',
      ok_cl: 'alert alert-success',
      warn_cl: 'alert alert-warning',
      type: 'success'
    };
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
      for (var j = 0; j < $scope.fileUploads.length; j++) {
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
      var tracker = {
        lbl: file.name,
        prog: 0,
        fileName: file.name,
        def_cl: 'progress-bar progress-bar-striped active',
        ok_cl: 'progress-bar progress-bar-success progress-bar-striped',
        nok_cl: 'progress-bar progress-bar-danger progress-bar-striped'
      };
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
            url: '/redbox-admin/fileHarvest/mint/' + file.name,
            method: 'PUT',
            headers: {
              'file-size': file.size
            },
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
      var stat = FileHarvest.delete({
        sysType: 'mint',
        fileName: fileName
      }, function() {
        $scope.getMintPendingFileList();
      });
    };
  }])
  // -----------------------------------------------------------
  // ConfigCtrl
  // - gets and sets RB/Mint configuration
  //
  // -----------------------------------------------------------
  .controller('ConfigCtrl', ['$scope', '$upload', '$resource', 'redboxConfig', 'authService', '$route', 'modalDiag', '$location', 'authWatcher', '$http', function($scope, $upload, $resource, redboxConfig, authService, $route, modalDiag, $location, authWatcher, $http) {
    authWatcher.addExpiryChecker($scope);
    var Config = $resource('/redbox-admin/config/section/:sysType/:sectionName', {
      sysType: '@sysType',
      sectionName: '@id'
    });
    $scope.rbSectionList = [];
    $scope.secDetails = {
      redbox: null,
      mint: null
    };
    $scope.currentSysType = $route.current.params.sysType;
    $scope.currentSecId = $route.current.params.id;
    $scope.currentTitle = "";
    $scope.fileUploadObj = null;


    $scope.getRbSection = function() {
      Config.get({
        sysType: 'redbox'
      }, function(rbSection) {
        for (var i = 0; i < rbSection.sections.length; i++) {
          $scope.rbSectionList.push(rbSection.sections[i]);
          var id = rbSection.sections[i].id;
          if ($scope.currentSecId == id) {
            $scope.currentTitle = rbSection.sections[i].title;
          }
        }
      });
    };

    if ($scope.currentSecId != null) {
      Config.get({
        sysType: $scope.currentSysType,
        sectionName: $scope.currentSecId
      }, function(sectionDetails) {
        sectionDetails.sysType = $scope.currentSysType;
        // inject subsection headers
        for (var i = 0; i < sectionDetails.subsections.length; i++) {
          for (var x = 0; x < sectionDetails.subsections[i].form.length; x++) {
            // custom form elements inserted here due to dev time constraints
            if (sectionDetails.subsections[i].form[x].type == "img") {
              sectionDetails.subsections[i].form[x].type = "help";
              var imgPath = sectionDetails.subsections[i].model[sectionDetails.subsections[i].form[x].modelVar];
              var successFn = function(i, x, imgPath) {
                return function(data, status, headers, config) {
                  sectionDetails.subsections[i].form[x].helpvalue = "<img src='" + data + "'/>";
                  // download the image data into a variable so the request goes through the auth filter
                  $scope.fileUploadObj = {
                    field: sectionDetails.subsections[i].form[x].modelVar,
                    model: sectionDetails.subsections[i].model,
                    form: sectionDetails.subsections[i].form[x],
                    subsection: sectionDetails.subsections[i],
                    imgPath: imgPath
                  };
                }
              };
              $http.get(imgPath).success(successFn(i, x, imgPath));
            }
          }
          sectionDetails.subsections[i].form.splice(0, 0, {
            type: "help",
            helpvalue: "<div class='alert alert-info'>" +
              sectionDetails.subsections[i].title +
              "</div>"
          });
        }
        $scope.secDetails[$scope.currentSysType] = sectionDetails;

      });
    }

    $scope.onFileSelect = function($files) {
      console.log("File selected:" + $files[0].name);
      $scope.fileUploadObj.file = $files[0];
    };

    $scope.isSaving = false;

    $scope.saveSection = function(rbSection) {
      $scope.isSaving = true;
      var valList = [];
      for (var i = 0; i < rbSection.subsections.length; i++) {
        valList.push(tv4.validateMultiple(rbSection.subsections[i].model, rbSection.subsections[i].schema));
      }
      var valid = true;
      for (var i = 0; i < valList.length; i++) {
        if (!valList[i].valid) {
          valid = false;
          break;
        }
      }
      if (!valid) {
        console.log("Failed validation.");
        modalDiag.showModal('failedVal.html', 'static');
        return;
      }
      var restartDiagFn = function() {
        $scope.isSaving = false;
        modalDiag.showModal('restart.html', 'static', function(result) {
          if (result == 'restart') {
            $location.path("/instance/" + $scope.currentSysType + "/restart");
          }
        });
      };
      var status = rbSection.$save().then(function() {
        console.log("Saved");
        // check if we should upload...
        var progHdlr = function(evt) {};
        var nokHdlr = function(evt) {};
        if ($scope.fileUploadObj) {
          var file = $scope.fileUploadObj.file;
          if (file) {
            console.log("Uploading file..");
            var basename = $scope.fileUploadObj.imgPath.split(/[\\/]/).pop();
            $scope.upload = $upload.upload({
                url: $scope.fileUploadObj.imgPath,
                method: 'PUT',
                headers: {
                  'file-size': file.size
                },
                //withCredentials: true,
                data: {},
                file: file, // or list of files ($files) for html5 only
                fileName: basename,
                // customize file formData name ('Content-Disposition'), server side file variable name.
                //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                //formDataAppender: function(formData, key, val){}
              })
              .progress(progHdlr)
              .success(function() {
                restartDiagFn();
              })
              .error(nokHdlr);
          } else {
            restartDiagFn();
          }
        } else {
          restartDiagFn();
        }
      }, function() {
        console.log("Error saving");
      }, function() {
        console.log("Saving...");
      });
    };

  }])
  .controller('LogviewCtrl', ['$scope', '$http', '$upload', '$resource', 'redboxConfig', 'authService', '$route', 'modalDiag', 'paginator', '$location', 'authWatcher', function($scope, $http, $upload, $resource, redboxConfig, authService, $route, modalDiag, paginator, $location, authWatcher) {
    authWatcher.addExpiryChecker($scope);
    var self = this;
    self.logtype = "redbox-main";
    self.logevt = "*";
    self.harvestRuns = {};
    self.logViewData = {};
    self.logCount = 0;
    self.getData = function(action) {
      paginator.doPage(action);

      return $http.get('/redbox-admin/logview/get/' + self.logtype + '/' + self.logevt + '/' + paginator.getLogFrom()).then(
        function(response) {
          self.logViewData = response.data.logData;
          paginator.setLogCount(response.data.count);
          self.logCount = response.data.count;
        }
      );
    };

    self.submit = function() {
      self.getData();
    };

    self.getData();

  }])
  .controller('HarvesterListCtrl', ['$scope', '$http', '$upload', '$resource', 'redboxConfig', 'authService', '$route', 'modalDiag', 'paginator', '$location', 'authWatcher', function($scope, $http, $upload, $resource, redboxConfig, authService, $route, modalDiag, paginator, $location, authWatcher) {
    authWatcher.addExpiryChecker($scope);
    var self = this;
    self.harvestRuns = {};
    self.logCount = 0;

    self.getHarvesterList = function(action) {
      paginator.doPage(action);
      return $http.get('/redbox-admin/logview/harvester/list/' + paginator.getLogFrom()).then(
        function(response) {
          var hruns = response.data.logData;
          var harvestRuns = [];
          //At the moment the harvest start message is written twice resulting in 2 harvest run records in the index. We need to filter out the duplicates
          var varId = '';
          for (var i = 0; i < hruns.length; i++) {
            if (hruns[i]._source.hrid_start != varId) {
              harvestRuns.push(hruns[i]);
              varId = hruns[i]._source.hrid_start;
            }
          }
          self.harvestRuns = harvestRuns;

          paginator.setLogCount(response.data.count);
          self.logCount = paginator.getLogCount();
        }
      );
    };

    self.getHarvesterList();

  }])
  .controller('HarvesterSummaryCtrl', ['$scope', '$http', '$upload', '$resource', 'redboxConfig', 'authService', '$route', 'modalDiag', 'paginator', '$location', 'authWatcher', function($scope, $http, $upload, $resource, redboxConfig, authService, $route, modalDiag, paginator, $location, authWatcher) {
    authWatcher.addExpiryChecker($scope);
    var hrid = $route.current.params.hrid;
    var self = this;
    self.harvestFailedEvents = {};
    self.harvestRecsProcessed = 0;
    self.harvestRecsSucess = 0;
    self.harvestRecsFailed = 0;

    self.getTotalRecords = function(action) {
      return $http.get('/redbox-admin/logview/harvester/summary/totalrecs/' + hrid).then(
        function(response) {
          self.harvestRecsProcessed = response.data.count;
        }
      );
    };

    self.getSuccessEvents = function(action) {
      paginator.doPage(action);
      return $http.get('/redbox-admin/logview/harvester/summary/success/count/' + hrid).then(
        function(response) {
          self.harvestRecsSucess = response.data.count;
        }
      );
    };

    self.getFailedEvents = function(action) {
      paginator.doPage(action);
      return $http.get('/redbox-admin/logview/harvester/summary/fail/data/' + hrid + '/' + paginator.getLogFrom()).then(
        function(response) {
          self.harvestFailedEvents = response.data.logData;
          paginator.setLogCount(response.data.count);
          self.harvestRecsFailed = paginator.getLogCount();
        }
      );
    };

    self.getTotalRecords();
    self.getSuccessEvents();
    self.getFailedEvents();

  }])

// -----------------------------------------------------------
// ModalCtrl
// - Simple controller for modal dialog in the application.
// -----------------------------------------------------------
.controller('ModalCtrl', ['$scope', 'close', function($scope, close) {
  $scope.currentSysType = "ReDBox";
  $scope.close = function(result) {
    close(result, 500); // close, but give 500ms for bootstrap to animate
  };
}]);
