/**
 * JWS Service
 *
 * @description :: Sails service for validating and generating(test) JWS
 * @author      :: Shilo Banihit
 */

module.exports = {
    isInvalid: function(jwsStr) {
        var jws = require('jws');
        var errMsg = "";
        var authMethod = sails.config.authMethod;
        if (authMethod == 'jws') {
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
        }
        return errMsg;
    },
    getPayload: function(jwsStr) {
        var jws = require('jws');
        var decodedObj = jws.decode(jwsStr);
        return decodedObj.payload;
    },
    genJws: function(secret, payload) {
        var jws = require('jws');
        return jws.sign({
            header: {
                alg: 'HS256'
            },
            payload: JSON.stringify(payload),
            secret: secret
        });
    },
    genPayload: function(nowInSecs, roles) {
        var payload = {
            iss: "htp://127.0.0.1:9000/redbox",
            sub: "admin",
            aud: "http://127.0.0.1:1337/redbox-admin/security/login",
            iat: nowInSecs,
            nbf: nowInSecs - 1,
            exp: nowInSecs + 60,
            jti: nowInSecs + "_-1035754475",
            "typ": roles
        }
        return payload;
    }
};