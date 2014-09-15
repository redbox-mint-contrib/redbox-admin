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
    jwsSecret: "Please Change Key - This is very insecure.",
    // Configuration for the FileharvestController, must have absolute paths
    fileHarvest : {
        mint: {
          targetDir: "",
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