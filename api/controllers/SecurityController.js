/**
 * SecurityController
 *
 * @description :: Server-side logic for managing securities
 * @help        :: See http://links.sailsjs.org/docs/controllers
 * @author      :: Shilo Banihit
 */
module.exports = {
    /**
     * `SecurityController.login()`
     *
     *  Receives a form field named 'jws' and verifies it.
     */
    login: function(req, res) {
      var authMethod = sails.config.auth.method;
      if (authMethod == 'jws') {
          var jwsStr = req.body.jws;
          var payload = jwsService.getPayload(jwsStr);
          var view = 'savejws';
          // check if we have a valid login
          if (jwsService.isInvalid(jwsStr) || JSON.parse(payload).typ.indexOf('admin') == -1) {
              view = 'invalidjws';
          }
          return res.view(view, {
            jws: jwsStr,
            payload: payload
        });
      }
      return res.redirect(sails.config.instance.redbox.contextName);
    }
};