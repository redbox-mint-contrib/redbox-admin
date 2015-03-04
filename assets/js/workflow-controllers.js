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
    if ($scope.stages.indexOf(newStage) == -1 && /^[A-Za-z]+[-_][A-Za-z0-9]+$/.test(newStage)) {
      stageController.addStage({file:conf,stage:newStage},null,function(updated) {
        $scope.stages = updated.stages;
        $scope.showAdd = false;
        $scope.newStage = "";
        $scope.error = false;
      });
    } else {
      $scope.error = true;
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
.controller('StageSecsCtrl', ['$scope', '$resource', '$routeParams', 'Workflow', 'ConfSaver', 'FormLoader', function ($scope, $resource, $routeParams, Workflow, ConfSaver, FormLoader) {
  var params = {formConf: $routeParams.formConf, stage: $routeParams.stage};

  $scope.loaded = false;
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

  FormLoader(params, $scope);

  $scope.onSubmit = function(form) {
    ConfSaver(form, $scope);
  }

  var regActiveTabIndexIndex = /.+(\d)/;
  $scope.divIndex = 0;
  $scope.getComponentType = function(model, arrayIndex) {
    //Get the current component type for conditonal display
    // When form has more then one dimensional data, we have to hack to find out activeTab's index
    // as arrayIndex only works for one tab
    var activeTab = $('li.ng-scope.active')[0].innerHTML;
    try {
      $scope.divIndex = regActiveTabIndexIndex.exec(activeTab)[1];
    } catch (e) { // might be the sily updating causing problem
    }

    if (parseInt($scope.divIndex) >= 0)  {
      try {
        $scope.divIndex = parseInt($scope.divIndex);
        if ($scope.supportedComponents.indexOf($scope.model['divs'][$scope.divIndex]['fields'][arrayIndex]['component-type']) >= 0) {
          return $scope.model['divs'][$scope.divIndex]['fields'][arrayIndex]['component-type'];
        } else {
          return 'notsuppored';
        }
      } catch (e) { /* too many to show console.error(e) */ }
    }
  };

}])
.controller('StageSecsCtrlInd', ['$scope', '$resource', '$routeParams', 'Workflow', 'ConfSaver', 'FormLoader', function ($scope, $resource, $routeParams, Workflow, ConfSaver, FormLoader) {
  var params = {formConf: $routeParams.formConf, stage: $routeParams.stage, section: $routeParams.section};

  $scope.loaded = false;
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
            // more conditions are built/appended on fly, see prepareCTypes in FormLoader
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

  FormLoader(params, $scope);

  $scope.onSubmit = function(form) {
    ConfSaver(form, $scope);
  }

  $scope.divIndex = 0;
  $scope.getComponentType = function(model, arrayIndex) {
    try {
      if ($scope.supportedComponents.indexOf($scope.model['divs'][$scope.divIndex]['fields'][arrayIndex]['component-type']) >= 0) {
        return $scope.model['divs'][$scope.divIndex]['fields'][arrayIndex]['component-type'];
      } else {
        return 'notsuppored';
      }
    } catch (e) { /* too many to show console.error(e) */ }
  };
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
])
.factory('FormLoader', ['Workflow', function(Workflow) {
  // This Service sets a few variables in caller's $scope. Good or bad?
  var prepareCTypes = function(supportedComponents, field) {
    // prepare configs for known component types in form, append to the items list after 'unsported'
    // called when form is being bulit
    // See the 'conditional' item in form defintion
    for (var i=0, l=supportedComponents.length; i < l; i++) {
      field.push({"type":"conditional",
                  "condition":"getComponentType(model,arrayIndex) == '" + supportedComponents[i] + "'",
                  "items":["divs[][fields][][component-confs][" + supportedComponents[i] + "]"]
                 });
    }
    return field;
  };

  return function(params, scope) {
    Workflow.get(params, function (formDetails) {
      if (angular.isDefined(formDetails.message)) {
        console.log("Has error when loading: "  + formDetails.message)
        scope.err = formDetails.message;
        scope.loaded = true;
        return;
      }
      scope.formConf = params.formConf;
      scope.stage = params.stage;
      scope.schema = formDetails.schema;
      scope.schema_path = formDetails.schema_path;
      if (angular.isDefined(params.section)) {
        scope.section = params.section;
      }

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
      scope.model = model;

      scope.supportedComponents = formDetails.supportedComponents;
      scope.form[0]['items'][1]['items'] = prepareCTypes(scope.supportedComponents, scope.form[0]['items'][1]['items']);
      scope.loaded = true;
    });
  }
}]);
