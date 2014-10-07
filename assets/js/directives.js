'use strict';

/* Directives */

angular.module('redboxAdmin.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).
  directive('formDownloader', ['$compile', function ($compile) {
      return {
          restrict:'E',
          scope:{fileName:'@', baseUrl:'@', formSearchDepthStr:'@'},
          link:function (scope, elm, attrs) {
              scope.elm = elm[0];
              scope.formSearchDepth = parseInt(scope.formSearchDepthStr, 10);
              scope.getForm = function(elem, depth) {
                if (elem.parentNode && elem.parentNode.tagName == "FORM") {
                  return elem.parentNode;
                } else {
                  if (depth >= scope.formSearchDepth) {
                    console.error("Form Downloader directive: failed to find form in parent node(s), giving up after searching depth of: " + scope.formSearchDepth);
                  } else {
                    return scope.getForm(elem.parentNode, depth+1);
                  }
                }
              };
              scope.form = scope.getForm(elm[0], 0);
              scope.dlFileName =  scope.baseUrl +scope.fileName;
              scope.dlFile = function() {
                scope.form.action = scope.dlFileName;
                scope.form.submit();
              };
              elm.append($compile(
              '<button class="btn btn-warning" ng-click="dlFile()">{{fileName}}</button>'
              )(scope));
          }
      };
  }]);
