/**
 * SecurityController
 *
 * @description :: Server-side logic for managing securities
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	


  /**
   * `SecurityController.login()`
   */
  login: function (req, res) {
  	var jwsStr = req.body.jws;
    var payload = jwsService.getPayload(jwsStr);
    var view = 'savejws';
  	// check if we have a valid login
  	if (jwsService.isInvalid(jwsStr)) {
        view = 'invalidjws';
  	}
  	return res.view(view, {jws:jwsStr, payload:payload}); 	
  }
};

