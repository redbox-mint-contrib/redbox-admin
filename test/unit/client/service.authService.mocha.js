/**
 * authService Unit Testing
 *
 * @author :: Shilo Banihit
 *
 */
describe('redboxAdmin.services ==> authService', function() {
  beforeEach(module('redboxAdmin.services'));
  
  var authService, localStorageService, redboxConfig, $log, $window;
  
  beforeEach(inject(function(_authService_, _localStorageService_, _redboxConfig_, _$log_, _$window_) {
    authService = _authService_;
    localStorageService = _localStorageService_;
    _redboxConfig_.auth = config.clientConfig.auth;
    _redboxConfig_.instance = config.clientConfig.instance;
    redboxConfig = _redboxConfig_;
    redboxConfig.auth.method = 'none';
    $window = _$window_;
    $log = _$log_;
    
  }));
  
  describe('# With authMethod == none, isLoggedIn with empty localStorageService, should return true.', function() {
    it('isLoggedIn == true.', function() {
      expect(authService.isLoggedIn()).to.equal(true);
    });
  });
  
  describe('# With authMethod == jws,', function() {
    beforeEach(function() {
      redboxConfig.auth.method = 'jws';
      authService.redirectStub = sinon.stub(authService, 'redirect');
    });
    
    describe('Calling isLoggedIn should return false', function() {
      it('isLoggedIn == false.', function() {
        expect(authService.isLoggedIn()).to.equal(false);
      });
    });
    
    describe('Calling saveAuth should save credentials, so when calling...', function() {
      it('localStoragetServce.get() ==> admin_jws == testJws and admin_jws_payload == testPayload', function() {
        authService.saveAuth('testJws', 'testPayload');
        expect(localStorageService.get('admin_jws')).to.equal('testJws');
        expect(localStorageService.get('admin_jws_payload')).to.equal('testPayload');
      });
      it('getJws() == testJws', function() {
        authService.saveAuth('testJws', 'testPayload');
        expect(authService.getJws()).to.equal('testJws');
      });
      it('deleteAuth() will remove the credentials', function() {
        authService.saveAuth('testJws', 'testPayload');
        authService.deleteAuth();
        expect(localStorageService.get('admin_jws')).to.equal(null);
        expect(localStorageService.get('admin_jws_payload')).to.equal(null);
      });
    });
    
    describe('Calling login without login handlers/filters will redirect user to login URL', function() {
      it('redirect method called with redboxConfig.auth.url', function() {
        authService.login();
        expect(authService.redirect.callCount).to.equal(1);
        expect(authService.redirect.alwaysCalledWith(redboxConfig.auth.url)).to.equal(true);
      });
    });
    
    describe('Calling login with login filter set to cancel login will stop redirect...', function() {
      it('redirect method not called with redboxConfig.auth.url', function() {
        authService.addLoginHandler('test', function(cb) {cb(true);});
        authService.login();
        expect(authService.redirect.callCount).to.equal(0);
        expect(authService.redirect.neverCalledWith(redboxConfig.auth.url)).to.equal(true);
      });
    });
    
    describe('Calling login with login filter set not to cancel login will allow redirect...', function() {
      it('redirect method not called with redboxConfig.auth.url', function() {
        authService.addLoginHandler('test', function(cb) {cb(false);});
        authService.login();
        expect(authService.redirect.callCount).to.equal(1);
        expect(authService.redirect.calledWith(redboxConfig.auth.url)).to.equal(true);
      });
    });
    
    describe('Adding multiple login filters will only use the first filter added.', function() {
      it('redirect method not called with redboxConfig.auth.url', function() {
        authService.addLoginHandler('test', function(cb) {cb(true);});
        authService.addLoginHandler('test', function(cb) {cb(false);});
        authService.login();
        expect(authService.redirect.callCount).to.equal(0);
        expect(authService.redirect.neverCalledWith(redboxConfig.auth.url)).to.equal(true);
      });
    });
    
    describe('Adding and removing a cancelling login filter will allow redirect', function() {
      it('redirect method not called with redboxConfig.auth.url', function() {
        authService.addLoginHandler('test', function(cb) {cb(true);});
        authService.removeLoginHandler();
        authService.login();
        expect(authService.redirect.callCount).to.equal(1);
        expect(authService.redirect.calledWith(redboxConfig.auth.url)).to.equal(true);
      });
    });
    
  });
  
});