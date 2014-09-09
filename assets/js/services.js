'use strict';

/* Services */

angular.module('redboxAdmin.services', ['LocalStorageModule', 'ui.bootstrap', 'redboxAdmin.config'])
.factory('authService', ['localStorageService','redboxConfig', function(localStorageService, redboxConfig) {
	var AuthService = {
		isLoggedIn: function() {
            var admin_jws_payload = localStorageService.get('admin_jws_payload');
			console.log("Checking locally if authenticated...");
			var errMsg = "";
			if (admin_jws_payload != null) {
				// check the times...
				var now = new Date();
				var nowInSecs = now.getTime() / 1000;
                // exp must be in the future
                if (admin_jws_payload.exp <= nowInSecs) {
					errMsg = "Token expired.";
				} else
				// iat must be in the past
				if (admin_jws_payload.iat >= nowInSecs) {
					errMsg = "IAT Invalid.";
				} else 
				// nbf must be in the past
				if (admin_jws_payload.nbf >= nowInSecs) {
					errMsg = "NBF Invalid.";
				}
				if (errMsg) {
					console.log("Not authenticated:" + errMsg);
				} else {
					return true;
				}
			}
			return false;
		},
		saveAuth: function(jws, payload) {
            console.log("Saving: " + payload);
			localStorageService.set('admin_jws',jws);
        	localStorageService.set('admin_jws_payload', payload);
		},
		deleteAuth: function() {
			localStorageService.remove('admin_jws');
        	localStorageService.remove('admin_jws_payload');
		},
        getJws: function() {
            return localStorageService.get('admin_jws');
        }
	};
    AuthService.login =  function() {
        window.location.href = redboxConfig.authUrl;
    };
    return AuthService;
}])
.factory('authInterceptor', ['$q', 'authService', function($q, authService) {
  return {
    request: function(config) {
      var loginStat = authService.isLoggedIn();
      if (!loginStat) {
          authService.deleteAuth();
          authService.login();
      }
      var jws = authService.getJws();
      if (jws) {
        config.headers.JWS = jws;
      }
      return config;
    },
    responseError: function(response) {
      if (response.status === 401 || response.status === 403) {
          authService.deleteAuth();
      }
      return $q.reject(response);
    }
  };
}]);
