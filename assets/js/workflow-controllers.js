'use strict';

angular.module('redboxAdmin.controllers').controller('WorkflowsCtrl', ['$scope', '$resource', function($scope, $resource) {
  var formBuilderController = $resource('/redbox-admin/formBuilder');
  formBuilderController.get({}, function(list){
    $scope.confs = list.flist;
  });
}])
.controller('WorkflowStagesCtrl', ['$scope', '$resource', '$routeParams', 'modalDiag', 'Workflow', function($scope, $resource, $routeParams, modalDiag, Workflow) {
  var conf = $routeParams.formConf;
  $scope.stageExist = false;
  var formBuilderController = $resource('/redbox-admin/formBuilder/:formConf');
  var list = formBuilderController.get({formConf:conf}, function(){
    $scope.formConf = conf;
    $scope.stages = list.stages;
  });

  var stageController = $resource('/redbox-admin/formBuilder/:file/:stage',null,{addStage:{method: 'PUT'}});
  $scope.addStage = function(newStage) {
    if ($scope.stages.indexOf(newStage) == -1) {
      stageController.addStage({file:conf,stage:newStage},null,function(updated) {
        $scope.stages = updated.stages;
        $scope.showAdd = false;
        $scope.newStage = "";
        $scope.stageExist = false;
      });
    } else {
      $scope.stageExist = true;
    }
  };
  $scope.removeStage = function(stage) {
    modalDiag.showModal('confirm.html', 'static', function(choice) {
      if (choice == 'Yes') {
        stageController.delete({file:conf,stage:stage},null,function(updated) {
          $scope.stages = updated.stages;
        });
      }
    });
  };
  $scope.sections = [];
  $scope.showSections = function(stage) {
//    formConf/:stage/:section, section is the element postion in divs, starts from 0
    Workflow.get({formConf:conf, stage:stage, list:'yes'}, function(data) {
      $scope.selectedStage = stage;
      $scope.sections = data.model.divs;
    });
  };
}])
.controller('StageSecsCtrl', ['$scope', '$resource', '$routeParams', 'Workflow', 'ConfSaver', function ($scope, $resource, $routeParams, Workflow, ConfSaver) {
  var conf = $routeParams.formConf;
  var stage = $routeParams.stage;
  $scope.stage = stage;

  // Default form looking
  $scope.form = [
    {
      type: "tabarray",
      tabType: "top",
      title: "($index +'. ' + value.heading)",
      key: "divs",
      add: "Add a div",
      items: [
        "divs[][heading]",
        // "divs[][fields]"
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
                  helpvalue: "<h4 class='alert alert-info' role='alert'>No configuration is available at this time.</h4>"
                }
              ]
            }
          ]
        }
      ]
    },
    "form-footer",
    "form-layout",
    {type:"submit", title: "Save"}
  ];

  var params = {formConf: conf, stage: stage};

  $scope.loaded = false;

  var supportedComponents; //Used for conditional display
  function prepareCTypes(field) {
    // prepare configs for component types in form, called when form is being bulit
    for (var i=0, l=supportedComponents.length; i < l; i++) {
      field.push({"type":"conditional",
                  "condition":"getComponentType(model,arrayIndex) == '" + supportedComponents[i] + "'",
                  "items":["divs[][fields][][component-confs][" + supportedComponents[i] + "]"]
                 });
    }
    return field;
  }

  Workflow.get(params, function (formDetails) {
    $scope.formConf = params.formConf;
    $scope.stage = params.stage;
    $scope.schema = formDetails.schema;
    var model = formDetails.model;
    // transformModelForForm
    for(var divIndex=0; divIndex < model.divs.length; divIndex++) {
      var div = model.divs[divIndex];
      for(var fieldIndex = 0; fieldIndex < div.fields.length; fieldIndex++) {
        var field = div.fields[fieldIndex];
        var componentType = field['component-type'];
        var componentTypeProperties = {};
        for(var fieldKey in field) {
          if(fieldKey != 'component-type' && fieldKey !='field-name') {
            componentTypeProperties[fieldKey] = field[fieldKey];
            delete model.divs[divIndex]['fields'][fieldIndex][fieldKey];
          }
        }
        field['component-confs'] = {};
        field['component-confs'][componentType] = componentTypeProperties;
        model.divs[divIndex].fields[fieldIndex] = field;
      }

    }
    $scope.model = model;

    supportedComponents = formDetails.supportedComponents;
    $scope.form[0]['items'][1]['items'] = prepareCTypes($scope.form[0]['items'][1]['items']);
    $scope.loaded = true;
  });

  var regActiveTabIndexIndex = /.+(\d)/;
  $scope.divIndex = 0;
  $scope.getComponentType = function(model, arrayIndex) {
    //Get the current component type for conditonal display
    var activeTab = $('li.ng-scope.active')[0].innerHTML;
    try {
      $scope.divIndex = regActiveTabIndexIndex.exec(activeTab)[1];
    } catch (e) { // might be the sily updating causing problem
    }

    if (typeof $scope.divIndex === 'undefined') { $scope.divIndex = 0; }
    try {
      if (supportedComponents.indexOf($scope.model['divs'][$scope.divIndex]['fields'][arrayIndex]['component-type']) >= 0) {
        return $scope.model['divs'][$scope.divIndex]['fields'][arrayIndex]['component-type'];
      } else {
        return 'notsuppored';
      }
    } catch (e) {}
  };
  $scope.onSubmit = function(form) {
    ConfSaver(form, $scope);
  }

//  $scope.onSubmit = function(form) {
//    var updateParams = {fileName: conf, stage: stage}
//    modalDiag.showModal('confirm.html', 'static', function(choice) {
//      if (choice == 'Yes') {
//        var model = JSON.parse(JSON.stringify($scope.model));
//        for(var divIndex=0; divIndex < model.divs.length; divIndex++) {
//          var div = model.divs[divIndex];
//          for(var fieldIndex = 0; fieldIndex < div.fields.length; fieldIndex++) {
//            var field = div.fields[fieldIndex];
//            var componentType = field['component-type'];
//            if ('component-confs' in field) {
//              var configuration = field['component-confs'][componentType];
//              for(var fieldKey in configuration) {
//                field[fieldKey] = configuration[fieldKey];
//              }
//              delete field['component-confs'];
//            }
//            model.divs[divIndex].fields[fieldIndex] = field;
//          }
//        }
////        var stageController = $resource('/redbox-admin/formBuilder/:fileName/:stage');
////        stageController.save({fileName: conf, stage: stage}, model, function (res) { alert("Saved successfully."); });
//        var stageController = $resource('/redbox-admin/formBuilder/:fileName/:stage', null, {update:{method: 'PUT'}});
//        stageController.update(updateParams, model, function (res) { alert("Saved successfully."); });
//
//        //  Above code does not validate form, if it is needed,
//        // First we broadcast an event so all fields validate themselves
////        $scope.$broadcast('schemaFormValidate');
//////
//////        // Then we check if the form is valid
////        if (form.$valid) {
//////          // ... do whatever you need to do with your data.
////            var r = confirm("Existing form configuration will be overwritten. Do you want to continue?");
////            if (r) {
////                alert("The file will be saved to somewhere.")
////        //************************************TODO: Move above save to here
////        //************************************TODO: End of Move
////            }
////        }
//      }
//    });
//  };

}])
.controller('StageSecsCtrlInd', ['$scope', '$resource', '$routeParams', 'Workflow', 'ConfSaver', function ($scope, $resource, $routeParams, Workflow, ConfSaver) {
  var conf = $routeParams.formConf;
  var stage = $routeParams.stage;
  var section = $routeParams.section;

  // Default form looking
  $scope.form = [
    {
      notitle: true,
      key: "divs",
      items: [
        "divs[][heading]",
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
                  helpvalue: "<h4 class='alert alert-info' role='alert'>No configuration is available at this time.</h4>"
                }
              ]
            }
          ]
        }
      ]
    },
    { type:"submit", title: "Save" }
  ];

  var params;
  if(angular.isDefined(section)) {
    params = {formConf:conf, stage:stage, section:section};
  } else {
    console.error("Why are we here? ng-route has problem");
  }

  $scope.loaded = false;

  var supportedComponents; //Used for conditional display
  function prepareCTypes(field) {
    // prepare configs for component types in form, called when form is being bulit
    for (var i=0, l=supportedComponents.length; i < l; i++) {
      field.push({"type":"conditional",
                  "condition":"getComponentType(model,arrayIndex) == '" + supportedComponents[i] + "'",
                  "items":["divs[][fields][][component-confs][" + supportedComponents[i] + "]"]
                 });
    }
    return field;
  }

  Workflow.get(params, function (formDetails) {
    $scope.formConf = params.formConf;
    $scope.stage = params.stage;
    $scope.section = params.section;
    $scope.schema = formDetails.schema;
    var model = formDetails.model;
    // transformModelForForm
    for(var divIndex=0; divIndex < model.divs.length; divIndex++) {
      var div = model.divs[divIndex];
      for(var fieldIndex = 0; fieldIndex < div.fields.length; fieldIndex++) {
        var field = div.fields[fieldIndex];
        var componentType = field['component-type'];
        var componentTypeProperties = {};
        for(var fieldKey in field) {
          if(fieldKey != 'component-type' && fieldKey !='field-name') {
            componentTypeProperties[fieldKey] = field[fieldKey];
            delete model.divs[divIndex]['fields'][fieldIndex][fieldKey];
          }
        }
        field['component-confs'] = {};
        field['component-confs'][componentType] = componentTypeProperties;
        model.divs[divIndex].fields[fieldIndex] = field;
      }

    }
    $scope.model = model;

    supportedComponents = formDetails.supportedComponents;
    $scope.form[0]['items'][1]['items'] = prepareCTypes($scope.form[0]['items'][1]['items']);
    $scope.loaded = true;
  });

  $scope.onSubmit = function(form) {
    ConfSaver(form, $scope);
  }

//  $scope.onSubmit = function(form) {
//    console.log("Can we get section? " + section);
//    var updateParams = {fileName: conf, stage: stage}
//    if(angular.isDefined(section)) {
//      console.log("We should update a section only");
//      updateParams['section'] = section;
//    }
//    modalDiag.showModal('confirm.html', 'static', function(choice) {
//      if (choice == 'Yes') {
//        var model = JSON.parse(JSON.stringify($scope.model));
//        for(var divIndex=0; divIndex < model.divs.length; divIndex++) {
//          var div = model.divs[divIndex];
//          for(var fieldIndex = 0; fieldIndex < div.fields.length; fieldIndex++) {
//            var field = div.fields[fieldIndex];
//            var componentType = field['component-type'];
//            if ('component-confs' in field) {
//              var configuration = field['component-confs'][componentType];
//              for(var fieldKey in configuration) {
//                field[fieldKey] = configuration[fieldKey];
//              }
//              delete field['component-confs'];
//            }
//            model.divs[divIndex].fields[fieldIndex] = field;
//          }
//        }
////        var stageController = $resource('/redbox-admin/formBuilder/:fileName/:stage');
////        stageController.save({fileName: conf, stage: stage}, model, function (res) { alert("Saved successfully."); });
//        var stageController = $resource('/redbox-admin/formBuilder/:fileName/:stage', null, {update:{method: 'PUT'}});
//        stageController.update(updateParams, model, function (res) { alert("Saved successfully."); });
//
//        //  Above code does not validate form, if it is needed,
//        // First we broadcast an event so all fields validate themselves
////        $scope.$broadcast('schemaFormValidate');
//////
//////        // Then we check if the form is valid
////        if (form.$valid) {
//////          // ... do whatever you need to do with your data.
////            var r = confirm("Existing form configuration will be overwritten. Do you want to continue?");
////            if (r) {
////                alert("The file will be saved to somewhere.")
////        //************************************TODO: Move above save to here
////        //************************************TODO: End of Move
////            }
////        }
//      }
//    });
//  };

}]);

angular.module('redboxAdmin.controllers').factory('ConfSaver', ['modalDiag', 'Workflow', function(modalDiag, Workflow) {
  return function(form, scope) {
    console.log("Can we get section? " + scope.section);
    var updateParams = {formConf: scope.formConf, stage: scope.stage}
    if(angular.isDefined(scope.section)) {
      console.log("We should update a section only");
      updateParams['section'] = scope.section;
    }
    modalDiag.showModal('confirm.html', 'static', function(choice) {
      if (choice == 'Yes') {
        var model = JSON.parse(JSON.stringify(scope.model));
        for(var divIndex=0; divIndex < model.divs.length; divIndex++) {
          var div = model.divs[divIndex];
          for(var fieldIndex = 0; fieldIndex < div.fields.length; fieldIndex++) {
            var field = div.fields[fieldIndex];
            var componentType = field['component-type'];
            if ('component-confs' in field) {
              var configuration = field['component-confs'][componentType];
              for(var fieldKey in configuration) {
                field[fieldKey] = configuration[fieldKey];
              }
              delete field['component-confs'];
            }
            model.divs[divIndex].fields[fieldIndex] = field;
          }
        }
//        var stageController = $resource('/redbox-admin/formBuilder/:fileName/:stage');
//        stageController.save({fileName: conf, stage: stage}, model, function (res) { alert("Saved successfully."); });
//        var stageController = $resource('/redbox-admin/formBuilder/:fileName/:stage', null, {update:{method: 'PUT'}});
//        stageController.update(updateParams, model, function (res) { alert("Saved successfully."); });
        Workflow.update(updateParams, model, function (res) { alert("Saved successfully."); });

        //  Above code does not validate form, if it is needed,
        // First we broadcast an event so all fields validate themselves
//        $scope.$broadcast('schemaFormValidate');
////
////        // Then we check if the form is valid
//        if (form.$valid) {
////          // ... do whatever you need to do with your data.
//            var r = confirm("Existing form configuration will be overwritten. Do you want to continue?");
//            if (r) {
//                alert("The file will be saved to somewhere.")
//        //************************************TODO: Move above save to here
//        //************************************TODO: End of Move
//            }
//        }
      }
    });
  };
}
]);
