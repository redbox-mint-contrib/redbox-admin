/**
 * grunt/pipeline.js
 *
 * The order in which your css, javascript, and template files should be
 * compiled and linked from your views and static HTML files.
 *
 * (Note that you can take advantage of Grunt-style wildcard/glob/splat expressions
 * for matching multiple files.)
 */



// CSS files to inject in order
//
// (if you're using LESS with the built-in default config, you'll want
//  to change `assets/styles/importer.less` instead.)
var cssFilesToInject = [
  'redbox-admin/styles/bootstrap.css',
  'redbox-admin/styles/bootstrap-theme.css',
  'redbox-admin/styles/spectrum.css',
  'redbox-admin/styles/**/*.css',
  'redbox-admin/css/dashboard.css'
];


// Client-side javascript files to inject in order
// (uses Grunt-style wildcard/glob/splat expressions)
var jsFilesToInject = [
  'redbox-admin/js/dependencies/jquery.js',
  'redbox-admin/js/dependencies/bootstrap.min.js',
  'redbox-admin/js/dependencies/sails.io.js',
  'redbox-admin/js/dependencies/angular-file-upload-shim.min.js',
  'redbox-admin/js/dependencies/tv4.js', // angular-schema-form
  'redbox-admin/js/dependencies/angular.js',
  'redbox-admin/js/dependencies/angular-route.js',
  'redbox-admin/js/dependencies/angular-resource.js',
  'redbox-admin/js/dependencies/FileAPI.min.js',
  'redbox-admin/js/dependencies/angular-file-upload.min.js',
  'redbox-admin/js/dependencies/angular-loader.js',
  'redbox-admin/js/dependencies/angular-mocks.js',
  'redbox-admin/js/dependencies/angular-sanitize.js', // angular-schema-form
  'redbox-admin/js/dependencies/ui-bootstrap-tpls.min.js',
  'redbox-admin/js/dependencies/ObjectPath.js',
  'redbox-admin/js/dependencies/spectrum.js', // color picker
  'redbox-admin/js/dependencies/angular-spectrum-colorpicker.min.js',   // color picker
  'redbox-admin/js/dependencies/schema-form.min.js',
  'redbox-admin/js/dependencies/bootstrap-decorator.min.js', // angular-schema-form
  'redbox-admin/js/dependencies/angular-modal-service.min.js',
  'redbox-admin/js/dependencies/bootstrap-colorpicker.min.js', // color picker
  'redbox-admin/js/dependencies/jquery.spectrum-sv.js', // color picker
  'redbox-admin/js/angular-local-storage.js',
  'redbox-admin/js/app.js',
  'redbox-admin/js/config.js',
  'redbox-admin/js/services.js',
  'redbox-admin/js/controllers.js',
  'redbox-admin/js/workflow-controllers.js',
  'redbox-admin/js/filters.js',
  'redbox-admin/js/directives.js'
];

// Client-side HTML templates are injected using the sources below
// The ordering of these templates shouldn't matter.
// (uses Grunt-style wildcard/glob/splat expressions)
//
// By default, Sails uses JST templates and precompiles them into
// functions for you.  If you want to use jade, handlebars, dust, etc.,
// with the linker, no problem-- you'll just want to make sure the precompiled
// templates get spit out to the same file.  Be sure and check out `tasks/README.md`
// for information on customizing and installing new tasks.
var templateFilesToInject = [
  'templates/**/*.html'
];



// Prefix relative paths to source files so they point to the proper locations
// (i.e. where the other Grunt tasks spit them out, or in some cases, where
// they reside in the first place)
module.exports.cssFilesToInject = cssFilesToInject.map(function(path) {
  return '.tmp/public/' + path;
});
module.exports.jsFilesToInject = jsFilesToInject.map(function(path) {
  return '.tmp/public/' + path;
});
module.exports.templateFilesToInject = templateFilesToInject.map(function(path) {
  return 'assets/' + path;
});
