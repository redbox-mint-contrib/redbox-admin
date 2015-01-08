/**
 * SecurityControllerTest
 *
 * @description :: Tests the SecurityController, requires sails.config.authMethod to be set to 'jws'.
 * @author      :: Shilo Banihit
 */
require('../../../bootstrap.test.js');
var request = require('supertest');
var jwsService = require('../../../../api/services/jwsService');
var config = require('../../../configLoader');

describe('SecurityController', function() {
  describe('#login() with invalid JWS, sails.config.authMethod needs to be "jws".', function() {
    it('Should respond with a server error.', function (done) {
      request(sails.hooks.http.app)
        .post('/redbox-admin/security/login')
        .send({ jws: 'test'})
        .expect(500, done);
    });
  });
  describe('#login() with expired JWS, sails.config.authMethod needs to be "jws".', function() {
    var expiredJws =  jwsService.genJws(config.auth.jwsSecret, jwsService.genPayload((new Date().getTime()/1000)-120, ["admin","reviewer"]));
    it('Should get respond with 200, but with login invalid message.', function (done) {
      request(sails.hooks.http.app)
        .post('/redbox-admin/security/login')
        .send({ jws: expiredJws})
        .expect(200)
        .expect(/Your login is invalid/, done);
    });
  });
  describe('#login() with valid JWS, but invalid role, sails.config.authMethod needs to be "jws".', function() {
    var validJws = jwsService.genJws(config.auth.jwsSecret, jwsService.genPayload(new Date().getTime()/1000, ["reviewer"]));
    it('Should get respond with 200, but with login invalid message', function (done) {
      request(sails.hooks.http.app)
        .post('/redbox-admin/security/login')
        .send({jws: validJws})
        .expect(200)
        .expect(/Your login is invalid/, done);
    });
  });
  describe('#login() with valid JWS, sails.config.authMethod needs to be "jws".', function() {
    var validJws = jwsService.genJws(config.auth.jwsSecret, jwsService.genPayload(new Date().getTime()/1000, ["admin","reviewer"]));
    it('Should get respond with 200, and redirect to main page', function (done) {
      request(sails.hooks.http.app)
        .post('/redbox-admin/security/login')
        .send({jws: validJws})
        .expect(200)
        .expect(/Redirecting to main page.../)
        .expect(/window.location.replace/, done);
    });
  });
});