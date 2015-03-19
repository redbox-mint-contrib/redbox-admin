'use strict';

angular.module('redboxAdmin.controllers').controller('WorkflowTypesCtrl', ['$scope', '$resource', function($scope, $resource) {
  var resource = $resource('/redbox-admin/workflowdef');
  resource.get({}, function(list){
    $scope.datatypes = list.flist;
  });
}])
.controller('WorkflowDefCtrl', ['$scope', '$resource', '$routeParams', function($scope, $resource, $routeParams) {
  var resource = $resource('/redbox-admin/workflowdef/:datatype');
  var r = resource.get({datatype:$routeParams.datatype}, function(res){
    $scope.model = r.content;
  });
  $scope.schema = {
    type: "object",
    properties: {
      "presentation-settings": {
        "type": "object",
        "properties": {
          "hide-funding-body-label": { "type": "boolean" },
          "use-embargoes": { "type": "boolean" },
          "use-technical-metadata": { "type": "boolean" }
        }
      },
      "harvester": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "workflow-harvester": {
            "type": "object",
            "properties": {
              "force-storage": { "type": "boolean" }
            }
          }
        }
      },
      "transformer": {
        "type": "object",
        "properties": {
          "curation": {
            "type": "array",
            "items": { "type": "string" }
          },
          "metadata": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      },
      "curation": {
        "type": "object",
        "properties": {
          "neverPublish": { "type": "boolean" },
          "alreadyCurated": { "type": "boolean" },
          "curation-state": { "type": "string" },
          "requiredIdentifiers": {
            "type": "array",
            "items": { "type": "string" }
          },
          "identifierDataMapping": {
            "type": "object",
            "properties": {
              "general": {
                "type": "object",
                "properties": {
                  "title": { "type": "string" },
                  "type": { "type": "string" }
                }
              }
            }
          }
        }
      },
      "transformerOverrides": {
        "type": "object",
        "properties": {
          "local": {
            "type": "object",
            "properties": {
              "template": { "type": "string" }
            }
          }
        }
      },
      "indexer": {
        "type": "object",
        "properties": {
          "script": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "rules": { "type": "string" }
            }
          },
          "params": {
            "type": "object",
            "properties": {
              "repository.name": { "type": "string" },
              "repository.type": { "type": "string" }
            }
          }
        }
      },
      "stages" : {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "label": { "type": "string" },
            "description": { "type": "string" },
            "security": {
              "type": "array",
              "items": { "type": "string" }
            },
            "visibility": {
              "type": "array",
              "items": { "type": "string" }
            },
            "template": { "type": "string" },
            "actions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "action-name": { "type": "string" },
                  "target-step": { "type": "string" }
                }
              }
            }
          }
        }
      }
    }
  };

  $scope.form = [
    "stages"
  ];
}]);
