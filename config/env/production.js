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

module.exports = {

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
    jwsSecret: "Please Change Key - This is very insecure.",
    // Configuration for the FileharvestController, must have absolute paths
    fileHarvest : {
        mint: {
          targetDir: "/mnt/ephemeral/tmp-web-admin/uploads/",
        }
    },
    instance: {
      redbox: {
        statusCmd:"/opt/redbox/server/tf.sh status", 
        restartCmd:"/opt/redbox/server/tf.sh restart", 
        stopCmd:"/opt/redbox/server/tf.sh stop", 
        startCmd:"/opt/redbox/server/tf.sh start"
      },
      mint: {
        statusCmd:"/opt/mint/server/tf.sh status", 
        restartCmd:"/opt/mint/server/tf.sh restart", 
        stopCmd:"/opt/mint/server/tf.sh stop", 
        startCmd:"/opt/mint/server/tf.sh start"
      }
    }
};
