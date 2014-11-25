'use strict';

angular.module('redboxAdmin.controllers').controller('FormBuilderCtrl', ['$scope', '$resource', function($scope, $resource) {
    var formBuilderController = $resource('/redbox-admin/formBuilder');
    var list = formBuilderController.get({}, function(){
            $scope.confs = list.flist;
    });
  }])
.controller('FormBuilderStagesCtrl', ['$scope', '$resource', '$routeParams', function($scope, $resource, $routeParams) {
    console.log("What do we know?");
    console.log($scope);
    console.log($routeParams);
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
.controller('FormBuilderStageSecCtrl', ['$scope', '$resource', '$routeParams', 'modalDiag', function ($scope, $resource, $routeParams, modalDiag) {
//    console.log($routeParams);
    var conf = $routeParams.formConf;
    var stage = $routeParams.stage;

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
    controller.get({formConf: conf, stage: stage}, function (formDetails) {
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
//                componentTypeProperties['label'] = 'See its working Li';
                field['component-confs'] = {};
                field['component-confs'][componentType] = componentTypeProperties;
                model.divs[divIndex].fields[fieldIndex] = field;
            }

        }

      $scope.model = model;

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
      try {
        $scope.divIndex = regActiveTabIndexIndex.exec(activeTab)[1];
      } catch (e) { // might by sily updating causing problem
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
         if (choice == 'No') {
           return;
         }
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

         console.log(model);
         var controller = $resource('/redbox-admin/formBuilder/:fileName/:stage');
         controller.save({fileName: conf, stage: stage}, model, function (res) { alert(JSON.stringify(res)); });
         return;

       //        // First we broadcast an event so all fields validate themselves
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
//
//            }
//        }

       });
    };
    $scope.form = [
      {
        type: "tabarray",
        tabType: "top",
        title: "($index +', ' + value.heading)",
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
  }]);
