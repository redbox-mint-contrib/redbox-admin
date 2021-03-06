/**
 * Production environment settings
 *
 * This file can include shared settings for a production environment,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

var config = {

  /***************************************************************************
   * Set the default database connection for models in the production        *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMysqlServer'
  // },

  /***************************************************************************
   * Set the port in the production environment to 80                        *
   ***************************************************************************/

  // port: 80,

  /***************************************************************************
   * Set the log level in production environment to "silent"                 *
   ***************************************************************************/

  // log: {
  //   level: "silent"
  // }
    auth: {
      url:'http://127.0.0.1:9000/redbox/default/jws/admin/jws.script/redboxAdmin',
      outUrl:"http://127.0.0.1:9000/redbox/default/authentication.ajax",
      method: "none",
      expiryCheckInterval:10000,
      expiryThreshold:10,
      loginPath: 'default/jws/admin/jws.script/redboxAdmin',
      authScript: 'default/authentication.ajax',
      jwsSecret: "Please Change Key - This is very insecure."
    },
    // Configuration for the FileharvestController, must have absolute paths
    fileHarvest : {
        mint: {
          targetDir: "/opt/harvester/.json-harvester-manager-production/harvest/mint-csvjdbc/input",
          owner: "tomcat",
          group: "tomcat",
        }
    },
    instance: {
      redbox: {
        contextName:"/redbox-admin/",
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
          mainColours: {path:"home/less/variables.less", schema:"home/config-schema/variables.less.schema.json", compileIncludePath:"/opt/redbox/home/less/main.less:/opt/redbox/home/less/variables.less", compileSource: "/opt/redbox/home/less/redbox.less", compileTarget:"/opt/redbox/portal/default/redbox/css/redbox.css", onWriteSuccess:"compileLess"},
          mainLogo: {path:"portal/default/redbox/images/RedBox_Logo_Text.png", schema:"home/config-schema/portalImage.schema.json"}
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
          branding: {
            title:"Branding",
            subsections:[{source:"mainColours", title:"Main Colours", form:[
              {
                key:"@banner-background-colour", 
                title:"Banner Background Colour",
                colorFormat:'hex', 
                spectrumOptions:{
                chooseText:"Select", 
                cancelText:"Cancel",  
                showInitial: true,
                showPalette: true,
                showSelectionPalette: true,
                showInput:true,
               }
              },
              { key:"@title-background-colour", 
                title:"Title Bar Background Colour",
                colorFormat:'hex', 
                spectrumOptions:{
                chooseText:"Select", 
                cancelText:"Cancel",  
                showInitial: true,
                showPalette: true,
                showSelectionPalette: true,
                showInput:true,
               }
              },
              { key:"@menu-background-colour", 
                title:"Dropdown Menu Background Colour",
                colorFormat:'hex', 
                spectrumOptions:{
                chooseText:"Select", 
                cancelText:"Cancel",  
                showInitial: true,
                showPalette: true,
                showSelectionPalette: true,
                showInput:true,
               }
              },
            ]},{source:"mainLogo", title:"Main Logo", form:[{type:"img",modelVar:"imgPath"}]}]
          },
          siteDetails: {
            title:"Site Details",
            subsections: [{source:"siteDetails", title:"siteDetails.json"}]
          },
          identity: {
            title:"Identity",
            subsections: [{source:"identity", title:"identity.json"}]
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
            subsections: [{source:"apiSecurity", title:"Manage ReDBox API users and their associated keys"}]
          }
        }
      }
    }

};

// Configuration that will be made available to the client, intentionally limiting but not repeating configuration.
config.clientConfig = {
  auth: config.auth,
  instance: {
    refreshInterval:30000
  }
};

module.exports = config;
