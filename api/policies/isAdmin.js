/**
 * isAdmin
 *
 * @module      :: Policy
 * @description :: Ensures the current user is authorized: is an admin. User must be previously authenticated by 'isLoggedIn'
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
    var authMethod = sails.config.auth.method;
    if (authMethod == 'jws') {
        var jwsStr = req.get('JWS');
        if (jwsStr == null) {
            jwsStr = req.param('jws');
        }
        var payload = JSON.parse(jwsService.getPayload(jwsStr));
        var roles = payload.typ;
        if (roles.indexOf("admin") >= 0) {
            return next();
        }
        // User is not allowed
        // (default res.forbidden() behavior can be overridden in `config/403.js`)
        return res.forbidden({
            error: 'You are not permitted to perform this action, not an admin.'
        });
    } else {
        return next();
    }
};