'use strict';

/* Services */

angular.module('redboxAdmin.services', ['LocalStorageModule', 'ui.bootstrap', 'redboxAdmin.config','angularModalService'])
.factory('authService', ['localStorageService','redboxConfig', function(localStorageService, redboxConfig) {
    var loginHandlers = [];
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
      var cancelLogin = false;
      var handlerCnt = 0;
      var loginFn = function() {
        if (!cancelLogin && handlerCnt == loginHandlers.length) {
          console.log("Login not cancelled, proceeding with redirect.");
          window.location.href = redboxConfig.authUrl;
        }
      };
      
      angular.forEach(loginHandlers, function(loginHandler) {
        console.log("Calling login handler:"+loginHandler.id);
        cancelLogin = loginHandler.fn(function(stat) {
          console.log("Stat is:" + stat);
          cancelLogin = stat;
          handlerCnt++;
          if (cancelLogin) {
            console.log("Login was cancelled by:" + loginHandler.id);
            handlerCnt = loginHandler.length;
          }
          loginFn();
        });
        
      });
      
    };
  
    AuthService.addLoginHandler = function(id, loginHandler) {
      var newHandler = {id:id, fn:loginHandler};
      angular.forEach(loginHandlers, function(loginHandler) {
        if (loginHandler.id == id) {
          console.log("Handler already added:"+id);
          newHandler = null;
        }
      });
      if (newHandler) {
        console.log("Handler added:"+id);
        loginHandlers.push(newHandler);
      }
    };
  
    return AuthService;
}])
.factory('authInterceptor', ['$q', 'authService', 'redboxConfig', function($q, authService, redboxConfig) {
  var authInterceptor = {
    request: function(config) {
      for (var i=0; i<authInterceptor.execeptionList.length; i++) {
        var exceptionUrl = authInterceptor.execeptionList[i];
        if (exceptionUrl == config.url || config.url.indexOf("partials") >=0) {
          console.log("URL intercept exempted:"+config.url);
          return config;
        }
      }
      var loginStat = authService.isLoggedIn(redboxConfig.authExpiryThreshold); // service shoudln't expire soon
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
  authInterceptor.execeptionList = [redboxConfig.authUrl];
  return authInterceptor;
}])
.factory('modalDiag', [ 'ModalService', function(ModalService) {
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
.factory('authWatcher', [ 'modalDiag', '$http', 'redboxConfig', 'authService', '$interval', function(modalDiag, $http, redboxConfig, authService, $interval) {
  var authWatcher = {
    curDiag: null,
    diag_rbUnavailable:'rbUnavailable.html',
    diag_loginExpiry:'loginExpiry.html',
    loginInterceptor: function(cb) {
      $http.head(redboxConfig.authUrl).success(function(data){
        cb(false);
      }).error(function(data, status, headers, config){
        cb(true);
        // show the dialog
        if (authWatcher.curDiag !== authWatcher.diag_rbUnavailable) {
          authWatcher.curDiag = authWatcher.diag_rbUnavailable;
          modalDiag.showModal(authWatcher.diag_rbUnavailable, 'static');
        }
      });
    }, 
    loginExpiryChecker: function() {
      console.log("Login expiry check running.");
      if (!authService.isLoggedIn(redboxConfig.authExpiryThreshold)) {
        authService.deleteAuth();
        if (authWatcher.curDiag === null) {
          authWatcher.curDiag = authWatcher.diag_loginExpiry;
          modalDiag.showModal(authWatcher.diag_loginExpiry, 'static', function() {
            authService.curDiag = null;
            authService.login();
          });
        }
      }
    }
  };
  
  authWatcher.addExpiryChecker = function($scope) {
    if (angular.isDefined($scope.sessionExpiryPromise)) {
      console.log("Session Expiry checker already created.");
    } else {
        $scope.sessionExpiryPromise = $interval(authWatcher.loginExpiryChecker, redboxConfig.authExpiryCheckInterval);
        $scope.$on('$destroy', function() {
          if (angular.isDefined($scope.sessionExpiryPromise)) {
            $interval.cancel($scope.sessionExpiryPromise);
            $scope.sessionExpiryPromise = undefined;
          }
        });
    }
  };
  
  authService.addLoginHandler('authWatcher', authWatcher.loginInterceptor);
  return authWatcher;
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
