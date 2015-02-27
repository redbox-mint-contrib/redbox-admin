#Editing a form definition

##Basic structure of definition file of workflow's forms

A workflow can have multiple stages. Each stage has a form which contains multiple sections letting a user puts in information. Forms can be defined in a file or spread in files with certain hierarchical structures. The workflow form editor allows a user to view stages and form definitions. It also allow editing a selected stage at a time. Currently only definitions are in a single file can be saved even stages in multiple files can be viewed. The basic structure, when stages are in a single file, is:


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
*  `formConfsPath` : workflow definition files, instance_installation_path + "home/form-configuration/",
*  `componentConfsPath` : components and their schemas to be scanned from, instance_installation_path + '/portal/default/default/form-components/field-elements/',
*  `formSchema` : schema of a workflow stage form, `formConfsPath` + "a named file (e.g. `form-schema_stage.json`)"

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


##References
* [angular-schema-form](https://github.com/Textalk/angular-schema-form/blob/master/docs/index.md)
