'use strict';

// -----------------------------------------------------------
// ReDBox / Mint administration app AngularJS Controllers
//
// author: Shilo Banihit
// -----------------------------------------------------------

angular.module('redboxAdmin.controllers', ['angularFileUpload','ui.bootstrap','redboxAdmin.config','schemaForm', 'ngRoute', 'angularModalService'])
// -----------------------------------------------------------
// IndexCtrl
//  - does nothing but an index, for now
// -----------------------------------------------------------
.controller('IndexCtrl', ['$scope', '$routeParams', '$location', 'authService', '$http', '$resource', function($scope, $routeParams, $location, authService, $http, $resource) {
  }])
.controller('FormBuilderCtrl', ['$scope', '$routeParams', '$location', 'authService', '$http', '$resource', function($scope, $routeParams, $location, authService, $http, $resource) {
    //~ var formBuilderController = $resource('/redbox-admin/formBuilder');
    var formBuilderController = $resource('/redbox-admin/formBuilder');
    var list = formBuilderController.get({}, function(){
            //~ console.log(list);
            $scope.confs = list.flist;
    });
  }])
.controller('FormBuilderStagesCtrl', ['$scope', '$routeParams', '$location', 'authService', '$http', '$resource', function($scope, $routeParams, $location, authService, $http, $resource) {
    console.log("What do we know?");
    console.log($scope);
    console.log($routeParams);
    console.log($location);
    console.log(authService);
    console.log($http);
    console.log($resource);
    var conf = $routeParams.formConf;
    var stage = $routeParams.stage;
//    if (stage != null) {
//        console.log("We should show editing UI for a stage");
//        var Config = $resource('/redbox-admin/config/section/:sysType/:sectionName');
//        Config.get({sysType:'arms',sectionName:'divs_tabarry'}, function(rbSection) {
//            console.log("See what have hajacked?");
//            console.log(rbSection);
//          });
//    } else {
//        console.log("Waiting for pickup a stage");
//    }
    $scope.addStage = function(stage) {
        console.debug("Adding " + stage.newEntry);
        //~ var controller = $resource('/redbox-admin/formBuilder/:file/:stage');
        //~ controller.get({file:'xxx',stage:'sss'},function(updated) { console.log("We are back"); console.log(updated)});
        //~ controller.save({file:'xxx',stage:'sss'},{some:"value"},function(updated) { console.log("We are back"); console.log(updated)});
        var controller = $resource('/redbox-admin/formBuilder/:file/:stage',null,{addStage:{method: 'PUT'}});
        controller.addStage({file:conf,stage:stage.newEntry},null,function(updated) {
            console.log("We are back");
            console.log(updated.stages);
            $scope.stages = updated.stages;
            });
    };
    $scope.removeStage = function(stage) {
        console.log(stage);
        alert(stage);
        var controller = $resource('/redbox-admin/formBuilder/:file/:stage');
        controller.delete({file:conf,stage:stage},null,function(updated) {
            console.log("Deteleted");
            $scope.stages = updated.stages;
            });
    };

    $scope.fileName= $routeParams.formConf;
    //~ var formBuilderController = $resource('/redbox-admin/formBuilder');
    var formBuilderController = $resource('/redbox-admin/formBuilder/:formConf');
    var list = formBuilderController.get({formConf:$routeParams.formConf}, function(){
            //~ console.log(list);
            $scope.formConf = conf;
            $scope.stages = list.stages;
    });
  }])
// -----------------------------------------------------------
// InstanceCtrl
//  - controls RB/Mint instance
// -----------------------------------------------------------
  .controller('InstanceCtrl', ['$scope', '$routeParams', '$location', 'authService', '$http', '$resource',  '$route','$interval','redboxConfig', 'modalDiag', function($scope, $routeParams, $location, authService, $http, $resource, $route, $interval, redboxConfig, modalDiag) {
    $scope.$http = $http;
    var Instance = $resource('/redbox-admin/instance/:sysType', {sysType:'@sysType'}, {
      get: {method:'GET'},
      restart: {method: 'PUT'},
      start: {method: 'POST'},
      stop: {method: 'DELETE'}
    });
    $scope.redbox = {sysType:'redbox',pending:false, stat:5, lastChecked:'n/a', cmdDisabled:false,
                     STAT_UP:0, STAT_STOPPING:1, STAT_DOWN:2, STAT_STARTING:3, STAT_RESTARTING:4, STAT_REFRESHING:5};
    $scope.mint = {sysType:'mint', pending:false, stat:5, lastChecked:'n/a', refreshDisabled:false,
                  STAT_UP:0, STAT_STOPPING:1, STAT_DOWN:2, STAT_STARTING:3, STAT_RESTARTING:4, STAT_REFRESHING:5};
    var statWatcher = function(sys) {
      return function() {
        switch(sys.stat) {
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
    $scope.runCmd = function (sysType, cmd, interimStat, runCmdCb) {
      // TODO: when restarting RB, make sure token does not expire 'soon'...
      var cb = function(sysType, cmd) {
        return function(confirm) {
          if (confirm == 'Yes') {
            if ($scope[sysType].pending == true) {
              console.log("Command canceled:" + sysType +"."+cmd+", there is a pending command.");
              return;
            }
            $scope[sysType].cmdDisabled = true;
            $scope[sysType].stat = interimStat;
            var stat = Instance[cmd]({sysType:sysType}, function() {
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
    if ($scope.currentSysType!=null) {
      $scope.runCmd($scope.currentSysType, 'restart', $scope[$scope.currentSysType].STAT_RESTARTING, function() {$location.path("/instance").replace();});
    }
    $scope.refreshPromise = undefined;
    var statRefresh = function() {
      if (angular.isDefined($scope.refreshPromise)) {
        console.log("Not refreshing status, there is a pending request.");
        return;
      }
      $scope.refreshPromise = $interval(function() {
        $scope.runCmd('redbox','get');
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
.controller('LogoutCtrl', ['$scope', '$routeParams', '$location', 'authService','$http','redboxConfig', function($scope, $routeParams, $location, authService, $http, redboxConfig)   {
      authService.deleteAuth();
    $http.post(redboxConfig.authOutUrl, 'verb=logout', {headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}}).success(function() {console.log("Logged out."); $location.path("/").replace();});
  }])
// -----------------------------------------------------------
// MintCsvCtrl
// - allows access, deletion and uploading of MInt CSV files
// -----------------------------------------------------------
.controller('MintCsvCtrl',  [ '$scope', '$upload', '$resource', 'redboxConfig','authService', function($scope, $upload, $resource, redboxConfig, authService) {
      $scope.jws = authService.getJws();
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
            method: 'PUT',
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
    }])
// -----------------------------------------------------------
// ConfigCtrl
// - gets and sets RB/Mint configuration
//
// -----------------------------------------------------------
.controller('ConfigCtrl',  [ '$scope', '$upload', '$resource', 'redboxConfig','authService', '$route', 'modalDiag','$location', function($scope, $upload, $resource, redboxConfig, authService, $route, modalDiag, $location ) {
    var Config = $resource('/redbox-admin/config/section/:sysType/:sectionName', {sysType:'@sysType', sectionName:'@id'});
    $scope.rbSectionList = [];
    $scope.secDetails = {redbox:null, mint:null};
    $scope.currentSysType = $route.current.params.sysType;
    $scope.currentSecId = $route.current.params.id;
    $scope.currentTitle = "";
    $scope.getRbSection = function() {
    Config.get({sysType:'redbox'}, function(rbSection) {
        for (var i=0; i<rbSection.sections.length; i++) {
          $scope.rbSectionList.push(rbSection.sections[i]);
          var id = rbSection.sections[i].id;
          if ($scope.currentSecId == id) {
            $scope.currentTitle = rbSection.sections[i].title;
          }
        }
      });
    };

    if ($scope.currentSecId != null) {
      Config.get({sysType:$scope.currentSysType, sectionName:$scope.currentSecId}, function(sectionDetails) {
        sectionDetails.sysType = $scope.currentSysType;
        // inject subsection headers
        for (var i=0; i<sectionDetails.subsections.length; i++) {
          sectionDetails.subsections[i].form.splice(0, 0, {type:"help", helpvalue:"<div class='alert alert-info'>"+
                                                           sectionDetails.subsections[i].title+
                                                           "</div>"});
        }
        $scope.secDetails[$scope.currentSysType] = sectionDetails;

      });
    }
    $scope.saveSection = function(rbSection) {
      var valList = [];
      for (var i=0; i<rbSection.subsections.length; i++) {
        valList.push(tv4.validateMultiple(rbSection.subsections[i].model,rbSection.subsections[i].schema));
      }
      var valid = true;
      for (var i=0; i<valList.length; i++) {
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
      var status = rbSection.$save().then(function() {
        console.log("Saved");
        modalDiag.showModal('restart.html', 'static', function(result) {
          if (result == 'restart') {
            $location.path("/instance/"+$scope.currentSysType+"/restart");
          }
        });
      }, function() {
        console.log("Error saving");
      }, function() {
        console.log("Saving...");
      });
    };
  }])
.controller('FormTabConfigCtrl', ['$resource', '$scope', '$routeParams', function ($resource, $scope, $routeParams) {
    console.log($routeParams);

    var supportedComponents; //Used for conditional display
    function prepareCTypes(field) {
      // prepare configs for component types in form
      for (var i=0, l=supportedComponents.length; i < l; i++) {
        field.push({"type":"conditional",
                    "condition":"getComponentType(model,arrayIndex) == '" + supportedComponents[i] + "'",
                    "items":["divs[][fields][][component-confs][" + supportedComponents[i] + "]"]
                   });
      }
      return field;
    }

    var controller = $resource('/redbox-admin/formBuilder/:formConf/:stage');
    controller.get({formConf: $routeParams.formConf, stage: $routeParams.stage}, function (formDetails) {
      $scope.formConf = $routeParams.formConf;
      $scope.schema = formDetails.schema;
      $scope.model = formDetails.model;
      supportedComponents = formDetails.supportedComponents;
//      console.log(JSON.stringify(supportedComponents));
      $scope.form[0]['items'][1]['items'] = prepareCTypes($scope.form[0]['items'][1]['items']);
//      console.log(JSON.stringify($scope.schema));
    });
    var regActiveTabIndexIndex = /.+(\d)/;
    $scope.divIndex = 0;
    $scope.getComponentType = function(model, arrayIndex) {
      //Get the current component type for conditonal display
      var activeTab = $('li.ng-scope.active')[0].innerHTML;
      $scope.divIndex = regActiveTabIndexIndex.exec(activeTab)[1];
      if (typeof $scope.divIndex === 'undefined') { $scope.divIndex = 0; }
      try {
        if (supportedComponents.indexOf($scope.model['divs'][$scope.divIndex]['fields'][arrayIndex]['component-type']) >= 0) {
            return $scope.model['divs'][$scope.divIndex]['fields'][arrayIndex]['component-type'];
        } else {
            return 'notsuppored';
        }
      } catch (e) {}
    };
    $scope.form = [
      {
        type: "tabarray",
        tabType: "top",
        title: "value.heading || ('div '+ $index)",
        key: "divs",
        add: "Add a div",
        onChange: function (form, modelValue) {
          console.log("value changed");
          console.log(form);
          console.log(modelValue);
        },
        items: [
          "divs[][heading]",
 //       "divs[][fields]"
          {
            key: "divs[][fields]",
            type: "array",
            items: [
              "divs[][fields][][field-name]",
              {
                key: "divs[][fields][][component-type]"
              },
// more conditions are built/appended on fly
              {
                type: "conditional",
                condition: "getComponentType(model,arrayIndex) == 'notsuppored'",
                items: [
                  {
                    type: "help",
                    helpvalue: "<h4>No config is availabe at this time. Please ask Andrew if you need it.</h4>"
                  }
                ]
              }
             ]
            }
         ]
      },
 //        "form-footer",
      {
        key: "[form-footer]",
        onChange: function (modelValue, form) {
          console.log("value changed");
          console.log(form);
          console.log(modelValue);
        }
        },
        "form-layout",
      {
        type: "submit",
        title: "Save"
        }
    ];
  }])
// -----------------------------------------------------------
// ModalCtrl
// - Simple controller for modal dialog in the application.
// -----------------------------------------------------------
  .controller('ModalCtrl',  [ '$scope','close', function($scope, close) {
   $scope.currentSysType = "ReDBox";
   $scope.close = function(result) {
      close(result, 500); // close, but give 500ms for bootstrap to animate
   };
  }]);
