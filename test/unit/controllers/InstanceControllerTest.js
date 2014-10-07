/**
 * InstanceControllerTest
 *
 * @description :: Tests the InstanceController
 * @author      :: Shilo Banihit
 */
require('../../bootstrap.test.js');
var request = require('supertest');
var jwsService = require('../../../api/services/jwsService');
var config = require('../../../config/local');

describe('InstanceController', function() {
  describe('#Get Mint status with valid JWS', function() {
    var validJws = jwsService.genJws(config.jwsSecret, jwsService.genPayload(new Date().getTime()/1000, ["admin","reviewer"]));
    it('Should be 200, with status', function (done) {
      request(sails.hooks.http.app)
        .get('/redbox-admin/instance/mint')
        .set('JWS',validJws)
        .expect(200, /status/, done);
    });
  });
  describe('#Get Mint status with invalid JWS', function() {
    var invalidJws = jwsService.genJws('lala', jwsService.genPayload(new Date().getTime()/1000, ["admin","reviewer"]));
    it('Should be 403', function (done) {
      request(sails.hooks.http.app)
        .get('/redbox-admin/instance/mint')
        .set('JWS',invalidJws)
        .expect(403, done);
    });
  });
  describe('#Get Mint status with expired JWS', function() {
    var invalidJws = jwsService.genJws(config.jwsSecret, jwsService.genPayload((new Date().getTime()/1000)-120, ["admin","reviewer"]));
    it('Should be 403', function (done) {
      request(sails.hooks.http.app)
        .get('/redbox-admin/instance/mint')
        .set('JWS',invalidJws)
        .expect(403, done);
    });
  });
  describe('#Get Mint status with no admin credentials', function() {
    var invalidJws = jwsService.genJws(config.jwsSecret, jwsService.genPayload((new Date().getTime()/1000), ["reviewer"]));
    it('Should be 403', function (done) {
      request(sails.hooks.http.app)
        .get('/redbox-admin/instance/mint')
        .set('JWS',invalidJws)
        .expect(403, done);
    });
  });
});