/**
 * isLoggedIn
 *
 * @module      :: Policy
 * @description :: Ensures the current user is authenticated - by checking that the user supplied a valid JWS object.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
    var authMethod = sails.config.authMethod;
    if (authMethod == 'jws') {
      // read the JWS from the header
      var jwsStr = req.get('JWS');
      if (jwsStr == null) {
        jwsStr = req.param('jws');
      }
      // verify the signature
      var errMsg = jwsService.isInvalid(jwsStr);
      if (errMsg != "") {
          return res.forbidden({error:errMsg});
      }
    }
    return next();
};
