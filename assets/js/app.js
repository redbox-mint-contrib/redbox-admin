'use strict';


// Declare app level module which depends on filters, and services
angular.module('redboxAdmin', [
  'ngRoute',
  'ngResource',
  'redboxAdmin.filters',
  'redboxAdmin.services',
  'redboxAdmin.directives',
  'redboxAdmin.controllers',
  'LocalStorageModule'
])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {templateUrl: 'partials/index.html', controller: 'IndexCtrl'});
  $routeProvider.when('/logout', {templateUrl: 'partials/logout.html', controller: 'LogoutCtrl'});
  $routeProvider.when('/mintCsvs', {templateUrl: 'partials/mintCsvs.html', controller: 'MintCsvCtrl'});
  $routeProvider.otherwise({redirectTo: '/'});
}])
.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
}]).config(['$compileProvider', function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|blob):/);
}]);