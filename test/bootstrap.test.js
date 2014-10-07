var Sails = require('sails');

before(function(done) {
  Sails.lift({
    // configuration for testing purposes
  }, function(err, sails) {
    Sails.log.debug("Unit Testing, Starting...");
    if (err) return done(err);
    // here you can load fixtures, etc.
    done(err, sails);
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  Sails.log.debug("Unit Testing, Ending...");
  Sails.lower(done);
});