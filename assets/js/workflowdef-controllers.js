'use strict';

angular.module('redboxAdmin.controllers').controller('WorkflowDefCtrl', ['$scope', '$resource', function($scope, $resource) {
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
            "template": { "type": "string" }
          }
        }
      }
    }
  };

  $scope.form = [
    "stages"
  ];

  $scope.model = {
  "presentation-settings": {
    "hide-funding-body-label": "false",
    "use-embargoes": "true",
    "use-technical-metadata": "true"
  },
  "harvester": {
    "type": "workflow-harvester",
    "workflow-harvester": {
      "force-storage": "true"
    }
  },
  "transformer": {
    "curation": [
      "local"
    ],
    "metadata": [
      "jsonVelocity",
      "selfSubtoDataset",
      "basicVersioning"
    ]
  },
  "curation": {
    "neverPublish": false,
    "alreadyCurated": false,
    "curation-state": "live",
    "requiredIdentifiers": [
      "local"
    ],
    "identifierDataMapping": {
      "general": {
        "title": "${title}",
        "type": "dataset"
      }
    }
  },
  "transformerOverrides": {
    "local": {
      "template": "${server.url.base}published/detail/[[OID]]"
    }
  },
  "indexer": {
    "script": {
      "type": "python",
      "rules": "dataset-rules.py"
    },
    "params": {
      "repository.name": "ReDBox",
      "repository.type": "Metadata Registry"
    }
  },
  "stages": [
    {
      "name": "inbox",
      "label": "Inbox",
      "description": "Potential records for investigation.",
      "security": [
        "guest"
      ],
      "visibility": [
        "librarian",
        "reviewer",
        "admin"
      ]
    },
    {
      "name": "investigation",
      "label": "Investigation",
      "description": "Records under investigation.",
      "security": [
        "librarian",
        "reviewer",
        "admin"
      ],
      "visibility": [
        "librarian",
        "reviewer",
        "admin"
      ],
      "template": "workflows/inbox"
    },
    {
      "name": "metadata-review",
      "label": "Metadata Review",
      "description": "Records to be reviewed by a data librarian.",
      "security": [
        "librarian",
        "reviewer",
        "admin"
      ],
      "visibility": [
        "librarian",
        "reviewer",
        "admin"
      ],
      "template": "workflows/dataset"
    },
    {
      "name": "final-review",
      "label": "Final Review",
      "description": "Completed records ready for publication and approval into the repository.",
      "security": [
        "reviewer",
        "admin"
      ],
      "visibility": [
        "librarian",
        "reviewer",
        "admin"
      ],
      "template": "workflows/dataset"
    },
    {
      "name": "live",
      "description": "Records already published in the repository.",
      "label": "Published",
      "security": [
        "reviewer",
        "admin"
      ],
      "visibility": [
        "guest"
      ],
      "template": "workflows/dataset"
    },
    {
      "name": "retired",
      "description": "Records that have been retired.",
      "label": "Retired",
      "security": [
        "admin"
      ],
      "visibility": [
        "guest"
      ],
      "template": "workflows/dataset"
    }
  ]
};
}]);
