'use strict';

angular.module('redboxAdmin.config',[]).provider('redboxConfig', function() {
  var values = {
    authUrl:'http://127.0.0.1:9000/redbox/default/jws/admin/jws.script/redboxAdmin',
    authOutUrl:"http://127.0.0.1:9000/redbox/default/authentication.ajax"
  };
  return {
    set: function (constants) {
        angular.extend(values, constants);
    },
    $get: function () {
      return values;
    }
  };
});