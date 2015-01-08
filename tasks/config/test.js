/**
*
* Tests, tests, unit tests!
* 
* Unit testing for both Sails and AngularJS components.
* 
* @author: Shilo Banihit
*/
module.exports = function(grunt) {
  
    // Sails unit tests
	grunt.config.set('mochaTest', {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/unit/server/**/*.js']
      }
	});
    // Angular tests
    grunt.config.set('karma', {
      unit: {
        configFile: 'test/karma.conf.js'
      }
    });

	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-karma');
};
