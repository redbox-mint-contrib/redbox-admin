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
          identity: {
            title:"Identity",
            subsections: [{source:"identity", title:"identity.json"}],
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
          }
        }
      }
    }
};
