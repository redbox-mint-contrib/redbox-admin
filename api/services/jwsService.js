/**
*  JWS Service.
*/
module.exports = {
	isInvalid: function(jwsStr) {
		var jws = require('jws');
		var errMsg = "";
        if (jwsStr != "" && jwsStr != null) {
            // signature check
            if (jws.verify(jwsStr, sails.config.jwsSecret)) {
                var decodedObj = jws.decode(jwsStr);
                var payload = JSON.parse(decodedObj.payload);
                // date and time checking...
                var now = new Date();
                var nowInSecs = now.getTime() / 1000;
                // iat must be in the past
                if (payload.iat >= nowInSecs) {
                    errMsg = "IAT Invalid.";
                } else 
                // nbf must be in the past
                if (payload.nbf >= nowInSecs) {
                    errMsg = "NBF Invalid.";
                } else
                // exp must be in the future
                if (payload.exp <= nowInSecs) {
                    errMsg = "Token expired.";
                } 
                // TODO: determine if we need to check the originating remote IP address
            } else {
                errMsg = "Invalid signature.";
            }
        } else {
            errMsg = "No JWS";
        }
		return errMsg;
	},
	getPayload: function(jwsStr) {
		var jws = require('jws');
		var decodedObj = jws.decode(jwsStr);
        return decodedObj.payload;
	}
};