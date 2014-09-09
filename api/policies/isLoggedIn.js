/**
 * isLoggedIn
 *
 * @module      :: Policy
 * @description :: Ensures the current user is authenticated - by checking that the user supplied a valid JWS object.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
    // read the JWS from the header
    var jwsStr = req.get('JWS');
    // verify the signature
    var errMsg = jwsService.isInvalid(jwsStr);
    if (errMsg != "") {
        return res.forbidden(errMsg);
    }
    return next();
    // User is not allowed
    // (default res.forbidden() behavior can be overridden in `config/403.js`)
    return res.forbidden('Please login before doing this action.');
};
