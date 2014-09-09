/**
 * isAdmin
 *
 * @module      :: Policy
 * @description :: Ensures the current user is authorized: is an admin. User must be previously authenticated by 'isLoggedIn'
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
 module.exports = function(req, res, next) {
  var jwsStr = req.get('JWS');
  var payload = JSON.parse(jwsService.getPayload(jwsStr));
  var roles = payload.typ;
  if (roles.indexOf("admin") >= 0) {
  	return next();
  }
  // User is not allowed
  // (default res.forbidden() behavior can be overridden in `config/403.js`)
  return res.forbidden('You are not permitted to perform this action, not an admin.');
};
