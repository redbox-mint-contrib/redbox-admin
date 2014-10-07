/**
 * ConfigControllerTest
 *
 * @description :: Tests the ConfigController
 * @author      :: Shilo Banihit
 */
require('../../bootstrap.test.js');
var request = require('supertest');
var jwsService = require('../../../api/services/jwsService');
var config = require('../../../config/local');

describe('ConfigController', function() {
  describe('#Get ReDBox Identity Section', function() {
    var validJws = jwsService.genJws(config.jwsSecret, jwsService.genPayload(new Date().getTime()/1000, ["admin","reviewer"]));
    it('Should be 200, with a institution data', function (done) {
      request(sails.hooks.http.app)
        .get('/redbox-admin/config/section/redbox/identity')
        .set('JWS',validJws)
        .expect(200, /institution/, done);
    });
  });
  describe('#Get ReDBox SiteDetails Section', function() {
    var validJws = jwsService.genJws(config.jwsSecret, jwsService.genPayload(new Date().getTime()/1000, ["admin","reviewer"]));
    it('Should be 200, with a urlSchemeName  data', function (done) {
      request(sails.hooks.http.app)
        .get('/redbox-admin/config/section/redbox/siteDetails')
        .set('JWS',validJws)
        .expect(200, /urlSchemeName/, done);
    });
  });
});