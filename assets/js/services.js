'use strict';

/* Services */

angular.module('redboxAdmin.services', ['LocalStorageModule', 'ui.bootstrap', 'redboxAdmin.config','angularModalService'])
.factory('authService', ['localStorageService','redboxConfig', function(localStorageService, redboxConfig) {
	var AuthService = {
		isLoggedIn: function(expiryThreshold) {
            if(redboxConfig.authMethod != 'jws') {
              return true;
            }
            var admin_jws_payload = localStorageService.get('admin_jws_payload');
			console.log("Checking locally if authenticated...");
			var errMsg = "";
			if (admin_jws_payload != null) {
				// check the times...
				var now = new Date();
				var nowInSecs = now.getTime() / 1000;
                expiryThreshold = expiryThreshold ? expiryThreshold : 0;
                // exp must be in the future
                if (admin_jws_payload.exp <= nowInSecs+expiryThreshold) {
					errMsg = "Token expired.";
				} else
				// iat must be in the past
				if (admin_jws_payload.iat > nowInSecs) {
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
.factory('authInterceptor', ['$q', 'authService', 'redboxConfig',function($q, authService, redboxConfig) {
  return {
    request: function(config) {
      var loginStat = authService.isLoggedIn(10); // service shoudln't expire in the next 10 seconds...
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
}])
.factory('modalDiag', [ 'ModalService','$rootScope', function(ModalService, $rootScope) {
  return {
    showModal: function(templateUrl, backdrop, cb, trackingObj) {
        return ModalService.showModal({
            templateUrl: templateUrl,
            controller: "ModalCtrl"
        }).then(function(modal) {
            if (trackingObj) {
              trackingObj.curModal = modal;
            }
            modal.element.modal({backdrop:backdrop});
            modal.close.then(function(result) {
                if (cb) cb(result);
            });
        });
    }
  };
}])
.factory('paginator', [function(){
	
	var counts = {
	logCount: 0,
	logFrom: 0,
	LOG_SIZE: 20};
	
	return {
		doPage: function(action){
		  action = action || "first";
		  switch(action){
		   case "first":
			   counts.logFrom = 0;
			   break;
		   case "next":
			   this.incrFrom();
			   break;
		   case "prev":
			   this.decrFrom();
			   break;
		   case "last":
			   this.lastFrom();
			   break;
		   default: counts.logFrom = 0;
		  }
	  },
	  
	  getLogFrom: function(){
		  return counts.logFrom;
	  },
	  
	  setLogFrom: function(lf){
		  counts.logFrom = lf;
	  },
	  
	  getLogCount: function(){
		  return counts.logCount;
	  },
	  
	  setLogCount: function(lc){
		  counts.logCount = lc;
	  },
	  
	  incrFrom: function(){
	console.log("INCR");
		  if(counts.logFrom < (counts.logCount - counts.LOG_SIZE)){
			  counts.logFrom += counts.LOG_SIZE;
		  }
	  },
	  
	  decrFrom: function(){
	console.log("DECR");
		  if(counts.logFrom >= counts.LOG_SIZE){
			  counts.logFrom -= counts.LOG_SIZE;
		  }
	  },
	  
	  lastFrom: function(){
		  //TODO - if to ensure pager does not spill past the end of the recordset.
		  counts.logFrom = counts.logCount - counts.LOG_SIZE; 
	  }
	}
}])
;
