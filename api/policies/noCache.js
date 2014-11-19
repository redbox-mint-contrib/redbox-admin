/**
 * noCache
 *
 * @module      :: Policy
 * @description :: Adds cache busting elements to response headers
 * @docs        :: http://sailsjs.org/#!documentation/policies
 * @author      :: Shilo Banihit
 */
module.exports = function(req, res, next) {
  res.set('Pragma', 'no-cache');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Expires', '0');
  return next();
};
