'use strict';

/* Services */

angular.module('redboxAdmin.services', ['LocalStorageModule', 'ui.bootstrap','redboxAdmin.config', 'angularModalService'])
.factory('authService', ['localStorageService','redboxConfig', '$log', '$window', function(localStorageService, redboxConfig, $log, $window) {
    var loginHandlers = [];
	var AuthService = {
		isLoggedIn: function(expiryThreshold) {
            if (redboxConfig.auth.method != 'jws') {
              return true;
            }
            var admin_jws_payload = localStorageService.get('admin_jws_payload');
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
                  $log.error("Not authenticated:" + errMsg);
              } else {
                  return true;
              }
			}
			return false;
		},
		saveAuth: function(jws, payload) {
          $log.debug("Saving: " + payload);
          localStorageService.set('admin_jws',jws);
          localStorageService.set('admin_jws_payload', payload);
        },
        deleteAuth: function() {
          localStorageService.remove('admin_jws');
          localStorageService.remove('admin_jws_payload');
        },
        getJws: function() {
          return localStorageService.get('admin_jws');
        },
        redirect: function(url) {
          $window.location.replace(url);
        }
    };

    AuthService.login =  function() {
      var cancelLogin = false;
      var handlerCnt = 0;
      var loginFn = function() {
        if (!cancelLogin && handlerCnt == loginHandlers.length) {
          $log.debug("Login not cancelled, proceeding with redirect.");
          AuthService.redirect(redboxConfig.auth.url);
        }
      };

      if (loginHandlers.length > 0) {
        angular.forEach(loginHandlers, function(loginHandler) {
          $log.debug("Calling login handler:"+loginHandler.id);
          cancelLogin = loginHandler.fn(function(stat) {
            $log.debug("Stat is:" + stat);
            cancelLogin = stat;
            handlerCnt++;
            if (cancelLogin) {
              $log.debug("Login was cancelled by:" + loginHandler.id);
              handlerCnt = loginHandler.length;
            }
            loginFn();
          });

        });
      } else {
        loginFn();
      }

    };

    AuthService.addLoginHandler = function(id, loginHandler) {
      var newHandler = {id:id, fn:loginHandler};
      angular.forEach(loginHandlers, function(loginHandler) {
        if (loginHandler.id == id) {
          $log.debug("Handler already added:"+id);
          newHandler = null;
        }
      });
      if (newHandler) {
        $log.debug("Handler added:"+id);
        loginHandlers.push(newHandler);
      }
    };

    AuthService.removeLoginHandler = function(id) {
      var idx = -1;
      if (id) {
        angular.forEach(loginHandlers, function(loginHandler, index) {
          if (loginHandler.id == id) {
            idx = index;
          }
        });
        if (idx != -1) {
          loginHandlers.splice(idx, 1);
        }
      } else {
        loginHandlers.splice(0, loginHandlers.length);
      }
    };

    return AuthService;
}])
.factory('authInterceptor', ['$q', '$injector', '$log', '$rootScope', function($q, $injector, $log, $rootScope) {
  var authInterceptor = {
    request: function(config) {
      return $injector.invoke(['$http', 'redboxConfig', 'authService', function($http, redboxConfig, authService) {
        if (config.url.lastIndexOf('config/client') > 0 || config.url.indexOf('.html') > 0) {
          $log.debug("URL exempted by convention: " + config.url);
          return config;
        }
        var defUrlCheck = $q.defer();
        var resolveFn = function(config) {
          return function(event, redboxConfig) {
            console.log("At authINterceptor");
            console.log(config.url);
            console.log(redboxConfig);

            authInterceptor.execeptionList = [redboxConfig.auth.url];
            for (var i=0; i<authInterceptor.execeptionList.length; i++) {
              var exceptionUrl = authInterceptor.execeptionList[i];
              if (exceptionUrl == config.url) {
                $log.debug("URL intercept exempted by config:"+config.url);
                defUrlCheck.resolve(config);
                return config;
              }
            }
            var loginStat = authService.isLoggedIn(redboxConfig.auth.expiryThreshold); // service shoudln't expire soon
            if (!loginStat) {
              authService.deleteAuth();
              authService.login();
            }
            var jws = authService.getJws();
            if (jws) {
              config.headers.JWS = jws;
            }
            defUrlCheck.resolve(config);
            return config;
          };
        };
        if (redboxConfig.auth == undefined) {
          console.log("At interceptor, waiting for config to load:" + config.url);
          $rootScope.$on('configLoaded', resolveFn(config));
        } else {
          console.log("At interceptor, config already loaded");
          return resolveFn(config)({}, redboxConfig);
        }
        return defUrlCheck.promise;
      }]);
    },
    responseError: function(response) {
      return $injector.invoke(['$http', 'redboxConfig', function($http, redboxConfig) {
        if (response.status === 401 || response.status === 403) {
          authService.deleteAuth();
          authService.login();
        }
        return $q.reject(response);
      }]);
    }
  };
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
.factory('authWatcher', [ 'modalDiag', '$http', 'redboxConfig', 'authService', '$interval', '$log', '$rootScope', function(modalDiag, $http, redboxConfig, authService, $interval, $log, $rootScope) {
  var authWatcher = {
    redboxConfig:redboxConfig,
    curDiag: null,
    diag_rbUnavailable:'rbUnavailable.html',
    diag_loginExpiry:'loginExpiry.html',
    loginInterceptor: function(cb) {
      $http.head(redboxConfig.auth.url).success(function(data){
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
      $log.debug("Login expiry check running.");
      if (!authService.isLoggedIn(redboxConfig.auth.expiryThreshold)) {
        authService.deleteAuth();
        if (authWatcher.curDiag === null) {
          authWatcher.curDiag = authWatcher.diag_loginExpiry;
          modalDiag.showModal(authWatcher.diag_loginExpiry, 'static', function() {
            authService.curDiag = null;
            authService.login();
          });
        } else {
          if (authWatcher.curDiag === authWatcher.diag_rbUnavailable) {
            $log.debug("ReDBox is unavailable, removing login expiry watcher");
            authWatcher.removeExpiryChecker();
          }
        }
      }
    }
  };

  authWatcher.addExpiryChecker = function($scope) {
    authWatcher.scope = $scope;
    if (angular.isDefined(authWatcher.scope.sessionExpiryPromise)) {
      $log.debug("Session Expiry checker already created.");
    } else {
      var addFn = function() {
        console.log("At services");
        console.log(redboxConfig);
        authWatcher.scope.sessionExpiryPromise = $interval(authWatcher.loginExpiryChecker, authWatcher.redboxConfig.auth.expiryCheckInterval);
        authWatcher.scope.$on('$destroy', function() {
          if (angular.isDefined(authWatcher.scope.sessionExpiryPromise)) {
            $interval.cancel(authWatcher.scope.sessionExpiryPromise);
            authWatcher.scope.sessionExpiryPromise = undefined;
          }
        });
        authWatcher.loginExpiryChecker();
      };
      // check if the config is loaded, otherwise wait for it...
      if (authWatcher.redboxConfig.auth == undefined) {
        console.log("Waiting for config to load");
        $rootScope.$on('configLoaded', function (event, redboxConfig) {
          authWatcher.redboxConfig = redboxConfig
          addFn();
        });
      } else {
        addFn();
      }
    }
  };

  authWatcher.removeExpiryChecker = function() {
    if (angular.isDefined(authWatcher.scope.sessionExpiryPromise)) {
      $interval.cancel(authWatcher.scope.sessionExpiryPromise);
      authWatcher.scope.sessionExpiryPromise = undefined;
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
          if(counts.logFrom < (counts.logCount - counts.LOG_SIZE)){
              counts.logFrom += counts.LOG_SIZE;
          }
      },

      decrFrom: function(){
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
.factory('Workflow', ['$resource', function($resource) {
    return $resource('/redbox-admin/formBuilder/:formConf/:stage/:section', null, {update:{method: 'PUT'}});
}])
;
