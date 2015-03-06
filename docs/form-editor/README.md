#Visualising and editing a form definition

##Basic structure of definition file of workflow's forms

A workflow can have multiple stages. Each stage has a form which contains multiple sections (as tabs in UI or divs in HTML) letting a user puts in information. Forms can be defined in a file (all-in-one type) or nested in files  with certain hierarchical structures (nested type). The workflow form editor allows a user to view stages and form definitions. User can add a new stage to an all-in-one type configuration file. It also allow editing a selected stage at a time with [limitations](#Limitations). So when editing, PLEASE USE IT WITH CAUTION even the editor creates backups in the directory which the file is saved with `backup_` as the prefix.

The basic structure, when stages are in a single file (all-in-one type), is:

```javascript
{
  "stages": {
      "stage1": {
        "divs": [
          {
            "heading": "Overview",
            "fields": [
               {
               "component-type": "text-block"
              }
            ]
          },
          ...
          {}
         ],
        "buttons": [        "/* often empty */"        ],
        "form-footer": "dmptformNew-footer",
        "form-layout": {
          "component-type": "tabbed-wizard",
          "tabHeaderIdentifier": "dmptTabHeader",
          "wizardDefPath": "wizard-definitions/researcher-dmpt-draft.json"
        },
        "validation-function": {
          "component-type": "active-tab",
          "tabHeaderIdentifier": "dmptTabHeader"
        }
      },
      "stage2": {},
      ...
      "stagen": {}
      }
}
```
When it is a nested type, each stage is a simple JSON object with stage name as a key:
```javascript
"arms-draft": {
  "config-file": "path_to_stages/named.json"
}
```

Each stage has sections (tabs in terms of UI, divs in terms of HTML):
```javascript
{
  "divs": [
  {
    "config-file": "path_to_stages/path/path_to_divs/named.json"
  }
  ...
  {
    "config-file": "path_to_stages/path/path_to_divs/named.json"
  }
  ],
  "buttons": [],
  "form-footer": "armsform-footer",
  "form-layout": {
    "component-type": "tabbed-wizard",
    "tabHeaderIdentifier": "armsTabHeader",
    "wizardDefPath": "wizard-definitions/arms-review.json"
    },
    "validation-function": {
      "component-type": "active-tab",
      "tabHeaderIdentifier": "armsTabHeader"
    }
}
```

And the configuration of each `config-file` element in `divs` array is a JSON object:

```javascript
{
  "heading": "Overview",
  "fields": [
    {
      "component-type": "typeA"
    }
    ...
    {
      "component-type": "typeB"
    }
  ]
}
```
##Structure of schema of form
The structure of the form of a stage can be described as a schema like this:

```javascript
{
  "type": "object",
  "$schema": "http://json-schema.org/draft-03/schema",
  "properties": {
    "divs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "heading": {
            "type": "string",
            "required": true
          },
          "fields": {
            "type": "array",
            "title": "Field list",
            "items": {
              "type": "object",
              "properties": {
                "field-name": {
                  "type": "string",
                  "required": true
                },
                "component-type": {
                  "type": "string",
                  "title": "Component type",
                  "required": true,
                  "enum": [
                    "textarea",
                    "simple",
                    "complex"
                  ]
                },
                "component-confs": {
                  "type": "object",
                  "properties": {
                    "type": "object",
                    "simple":{
                      "type": "object",
                      "properties": {
                        "placeholder": {
                          "type": "string"
                        }
                      }
                    },
                    "complex":{
                      "type": "object",
                      "properties": {
                        "key1": {
                          "type": "string"
                        }
                      }
                    },
                    "textarea":{
                      "type": "object",
                      "properties": {
                        "col": {
                          "type": "number"
                        },
                        "row": {
                          "type": "number"
                        }
                      }
                    }
                  }
                },
                "properties": {
                  "type": "object",
                  "title": "Style class",
                  "properties": {
                    "additional-classes": {
                      "title": "To assign additional CSS classes",
                      "type": "string"
                    }
                  }
                },
                "validation": {
                  "type": "object",
                  "title": "Validation rules",
                  "properties": {
                    "focus-id": {
                      "type": "string"
                    },
                    "save-rules": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "id": "http://jsonschema.net/stages/0/configuration/divs/0/fields/0/validation/save-rules/0",
                        "enum": [
                          "required"
                        ]
                      }
                    },
                    "validation-id": {
                      "type": "string",
                      "required": false
                    },
                    "validation-messages": {
                      "title": "What message to show to a type of save-rule: e.g. required",
                      "type": "object",
                      "properties": {
                        "required": {
                          "type": "string",
                          "required": true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "form-footer": {
      "type": "string",
      "title": "Footer template name",
      "required": false
    },
    "form-layout": {
      "type": "object",
      "title": "Div render method",
      "required": false,
      "properties": {
        "component-type": {
          "type": "string",
          "enum": [
            "tabbed-wizard"
          ]
        },
        "tabHeaderIdentifier": {
          "type": "string",
          "enum": ["armsTabHeader"]
        },
        "wizardDefPath": {
          "type": "string",
          "title": "Path to wizard definition (only used with tabbed-wizard)",
          "enum": ["wizard-definitions/arms-draft.json"]
        }
      }
    }
  }
}
```

In the above schema example, `items` of `fields` show some examples of how components are defined. The editor will load schemas of
component from file system. They should be named as `component-name.schema.json` in `/portal/default/default/form-components/field-elements/`.
A tool to create a valid schema can be found [here](http://jsonschema.net/#/#top).

##Where the editor gets components and schema files
*  `formConfsPath` : directory where to find workflow definition files, set as `instance_installation_path` + "home/form-configuration/". *Note*: backups (`backup_xxx.json`) and non-json files are exclued.
*  `componentConfsPath` : components and their schemas to be scanned from, set as `instance_installation_path` + '/portal/default/default/form-components/field-elements/',
*  `formSchema` : name of the schema of a workflow stage form being edited, set as `form-schema_stage.json`. The editor first try to find it from `formConfsPath`; if it cannot be found, it uses the defalut one come with the editor located in `assets/extras/`.

##Currently defined schemas of component
0. [checkbox](checkbox.schema.json)
0. [radio-button](radio-button.schema.json)
0. [textarea](textarea.schema.json)
0. [unordered-list](unordered-list.schema.json)
0. [date-picker](date-picker.schema.json)
0. [repeatable-text](repeatable-text.schema.json)
0. [text-block](text-block.schema.json)
0. [standard-button](standard-button.schema.json)
0. [text-input](text-input.schema.json)

##Limitations
0. Mixed types in a configuration is not supported. That is to say if the top level has `config-file` to include other configurations, all levels should keep in this type. ReDBox forms are defined in all-in-one type, e.g. [dmptform.json](https://github.com/redbox-mint/redbox/blob/master/config/src/main/config/home/form-configuration/dmptform.json). ARMS has forms are nested type, e.g. [armsform.json](https://github.com/qcif/rdsi-arms/blob/master/src/main/config/home/form-configuration/armsform.json).
0. If a new workflow stage is to be added to a configuration of nested type, it has to be done manually because it needs to have a hierarchical directory structure like (this)[https://github.com/qcif/rdsi-arms/tree/master/src/main/config/home/form-configuration/arms-steps] which has `arms-steps` and `arms-tabs`.
0. Re-order of tabs (divs) is not supported.

##References
* [angular-schema-form](https://github.com/Textalk/angular-schema-form/blob/master/docs/index.md)
