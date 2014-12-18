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
  $routeProvider.when('/instance', {templateUrl: 'partials/instance.html', controller: 'InstanceCtrl'});
  $routeProvider.when('/instance/:sysType/restart', {templateUrl: 'partials/instance.html', controller: 'InstanceCtrl'});
  $routeProvider.when('/logout', {templateUrl: 'partials/logout.html', controller: 'LogoutCtrl'});
  $routeProvider.when('/mintCsvs', {templateUrl: 'partials/mintCsvs.html', controller: 'MintCsvCtrl'});
  $routeProvider.when('/config', {templateUrl: 'partials/config.html', controller: 'ConfigCtrl'});
  $routeProvider.when('/config/:sysType/:id', {templateUrl: 'partials/config.html', controller: 'ConfigCtrl'});
  $routeProvider.when('/logview', {templateUrl: 'partials/logview.html', controller: 'LogviewCtrl'});
  $routeProvider.when('/harvester/list', {templateUrl: 'partials/harvest.html', controller: 'HarvesterListCtrl'});
  $routeProvider.when('/harvester/summary/:hrid', {templateUrl: 'partials/harvestSummary.html', controller: 'HarvesterSummaryCtrl'});
  $routeProvider.when('/workflow', {templateUrl: 'partials/workflows.html', controller: 'WorkflowsCtrl'});
  $routeProvider.when('/workflow/:formConf', {templateUrl: 'partials/workflowStages.html', controller: 'WorkflowStagesCtrl'});
  $routeProvider.when('/workflow/:formConf/:stage', {templateUrl: 'partials/workflowStageSecs.html', controller: 'StageSecsCtrl'});
  $routeProvider.when('/workflow/:formConf/:stage/:section', {templateUrl: 'partials/workflowStageSecs.html', controller: 'StageSecsCtrl'});
  $routeProvider.otherwise({redirectTo: '/'});
}])
.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
}]).config(['$compileProvider', function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|blob):/);
}]);
