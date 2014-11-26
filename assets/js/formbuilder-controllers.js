'use strict';

angular.module('redboxAdmin.controllers').controller('FormBuilderCtrl', ['$scope', '$resource', function($scope, $resource) {
  var formBuilderController = $resource('/redbox-admin/formBuilder');
  var list = formBuilderController.get({}, function(){
    $scope.confs = list.flist;
  });
}])
.controller('FormBuilderStagesCtrl', ['$scope', '$resource', '$routeParams', 'modalDiag', function($scope, $resource, $routeParams, modalDiag) {
  var conf = $routeParams.formConf;
  var formBuilderController = $resource('/redbox-admin/formBuilder/:formConf');
  var list = formBuilderController.get({formConf:conf}, function(){
    $scope.formConf = conf;
    $scope.stages = list.stages;
  });

  var stageController = $resource('/redbox-admin/formBuilder/:file/:stage',null,{addStage:{method: 'PUT'}});
  $scope.addStage = function(newStage) {
    stageController.addStage({file:conf,stage:newStage},null,function(updated) {
      $scope.stages = updated.stages;
      $scope.showAdd = false;
      $scope.newStage = "";
    });
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
}])
.controller('FormBuilderStageSecCtrl', ['$scope', '$resource', '$routeParams', 'modalDiag', function ($scope, $resource, $routeParams, modalDiag) {
  var conf = $routeParams.formConf;
  var stage = $routeParams.stage;

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

  var stageController = $resource('/redbox-admin/formBuilder/:formConf/:stage');

  stageController.get({formConf: conf, stage: stage}, function (formDetails) {
    $scope.formConf = $routeParams.formConf;
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
    modalDiag.showModal('confirm.html', 'static', function(choice) {
      if (choice == 'Yes') {
        var model = JSON.parse(JSON.stringify($scope.model));
        for(var divIndex=0; divIndex < model.divs.length; divIndex++) {
          var div = model.divs[divIndex];
          for(var fieldIndex = 0; fieldIndex < div.fields.length; fieldIndex++) {
            var field = div.fields[fieldIndex];
            var componentType = field['component-type'];
            var configuration = field['component-confs'][componentType];
            for(var fieldKey in configuration) {
              field[fieldKey] = configuration[fieldKey];
            }
            delete field['component-confs'];
            model.divs[divIndex].fields[fieldIndex] = field;
          }
        }
        var stageController = $resource('/redbox-admin/formBuilder/:fileName/:stage');
        stageController.save({fileName: conf, stage: stage}, model, function (res) { alert("Saved successfully."); });

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

  // Default form looking
  $scope.form = [
    {
      type: "tabarray",
      tabType: "top",
      title: "($index +', ' + value.heading)",
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
                  helpvalue: "<h4 class='alert alert-info' role='alert'>No configuration is availabe at this time.</h4>"
                }
              ]
            },
            {
              key: "divs[][fields][][properties]"
            },
            {
              key: "divs[][fields][][validation]"
            }
          ]
        }
      ]
    },
    "form-footer",
    "form-layout",
    {
      type: "submit",
      title: "Save"
    }
  ];
}]);
