/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMongodbServer'
  // }
    authMethod: "None",
    jwsSecret: "Please Change Key - This is very insecure.",
    // Configuration for the FileharvestController, must have absolute paths
    fileHarvest : {
        mint: {
          targetDir: "",
        }
    },
    instance: {
      redbox: {
        installPath:"/opt/redbox/",
        statusCmd:"server/tf.sh status",
        restartCmd:"server/tf.sh restart",
        stopCmd:"server/tf.sh stop",
        startCmd:"server/tf.sh start",
        urlCheck:"http://localhost:9000/redbox/default/home",
      },
      mint: {
        installPath:"/opt/mint/",
        statusCmd:"server/tf.sh status",
        restartCmd:"server/tf.sh restart",
        stopCmd:"server/tf.sh stop",
        startCmd:"server/tf.sh start",
        urlCheck:"http://localhost:9001/mint/default/home",
      }
    },
    sysconfig: {
      redbox: {
        // ReDBox's list of configurable file sources.
        // Each file source must specify a path and a schema.
        source: {
          system:"home/system-config.json",
          identity:{path: "home/config-include/1-main-modules/identity.json", schema:"home/config-schema/identity.schema.json"},
          authentication:{path: "home/config-include/1-main-modules/authentication.json", schema:"home/config-schema/authentication.schema.json"},
          sso: {path:"home/config-include/2-misc-modules/sso.json", schema:"home/config-schema/sso.schema.json"},
          rapidaaf: {path:"home/config-include/plugins/rapidaaf.json", schema:"home/config-schema/rapidaaf.schema.json"},
          siteDetails: {path:"home/config-include/1-main-modules/siteDetails.json", schema:"home/config-schema/siteDetails.schema.json"},
          env:"server/tf_env_work.sh",
          languageFiles:  {path: "home/language-files/", schema:""},
          lookupData:  {path: "portal/default/redbox/workflows/forms/data/", schema:""},
          apiSecurity: {path:"home/config-include/2-misc-modules/apiSecurity.json", schema:"home/config-schema/apiSecurity.schema.json"},
          form: {path:"home/form-configuration/arms_form.json", schema:"home/form-configuration/arms_form-schema.json"},
          formSection: {path:"home/form-configuration/arms_form_section.json", schema:"home/form-configuration/arms_form-schema.json"},
          stage: {path:"home/form-configuration/arms_form_astage.json", schema:"home/form-configuration/arms_form-schema_stage.json"}
        },
        field: {
          server_url: {
            source: "env",
            key: "export SERVER_URL="
          }
        },
        // Each entry in the section will be displayed as a link in the configuration page.
        // The section is composed of subsections. A subsection is composed of a source and an optional angular-schema-form form definition.
        // The value of the subsection's 'source' key must match an entry in the ReDBox's sources.
        // An optional 'form' subsection property controls what the 'angular-schema-form' form definition.
        section: {
          siteDetails: {
            title:"Site Details",
            subsections: [{source:"siteDetails", title:"siteDetails.json"}]
          },
          divs_tabarry: {
            title:"Form builder as tab array",
            subsections: [
                {
                    source:"stage",
                    title:"Create div when needed. Cannot do now yet.",
                    form:[
                        {
                            type:"tabarray",
                            tabType: "top",
                            title: "value.nick || ('Tab '+$index)",
                            key:"divs",
                            add: "Add a tab",
                            "items":["divs[][heading]","divs[][fields]"]
                        },
                        "form-footer",
                        "form-layout"
                    ]
                }
            ]
          },
          divs: {
            title:"Form builder in tabs with real strcutre",
            subsections: [
                {
                    source:"stage",
                    title:"Create div when needed. Cannot do now yet.",
                    form:[
                        {
                            type:"tabs",
                            tabs:[
                                {
                                    title:"div1",
                                    items:[
                                        {
                                            "key":"divs",
                                            "items":["[divs][][heading]","[divs][][fields]"]
                                        }
                                    ]
                                },
                                {
                                    title:"div2",
                                    items:[
                                        {
                                            "key":"divs",
                                            "items":["[divs][][heading]","[divs][][fields]"]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
          },
          form2: {
            title:"Form builder in tabs as a demo",
            subsections: [{source:"formSection", title:"Let it split", form:[{type:"tabs",tabs:[{title:"tab0",items:[{"key":"stages", "items":["[stages][][stagename]"]}]},{title:"tab1", items:[{ "type": "help",    "helpvalue": "Make a comment"  }]}, {title:"tab2",items:[ {"type": "submit",    "style": "btn-info",    "title": "OK"  }]}]}]}]
          },
          form: {
            title:"Form builder",
            subsections: [{source:"formSection", title:"Let it split", form:[{"key":"stages", "items":["[stages][][stagename]","[stages][][validation]","[stages][]['form-footer']","[stages][][configuration][keyvalue]","[stages][][configuration][divs][][heading]"]}]}, {source:"form", title:"Build a form in a way you like"}]
          },
          identity: {
            title:"Identity",
            subsections: [{source:"identity", title:"identity.json",form:[ "*", { "key": "identity", "items": [ "identity.institution","identity.RIF_CSGroup"] },{"type": "help","helpvalue": "help please"}]}]
          },
          authentication: {
            title:"Authentication",
            subsections: [{source:"authentication", title:"authentication.json"}, {source:"sso", title:"sso.json"}, {source:"rapidaaf",title:"rapidaaf.json"}]
          },
          languageFiles: {
            title:"Language Files",
            subsections: [{source:"languageFiles"}]
          },
          "lookupData": {
            title:"Lookup Data",
            subsections: [{source:"lookupData"}]
          },
          "apiSecurity": {
            title:"API Security",
            subsections: [{source:"apiSecurity", form:["*", { key: "comment", type: "textarea", placeholder: "Make a comment" }, { type: 'submit', title: 'Save' } ],title:"Manage ReDBox API users and their associated keys"}]
          }
        }
      }
    }
};
