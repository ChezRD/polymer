var gulp = require('gulp');
var replace = require('gulp-replace');
var shell = require('gulp-shell');
var del = require('del');
var fs = require('fs');
var path = require('path');

var polyclean = require('polyclean');

var workdir = 'dist';

gulp.task('micro', ['strip-micro']);
gulp.task('mini', ['strip-mini']);
gulp.task('max', ['strip-max']);

gulp.task('build', ['micro', 'mini', 'max']);

var artifacts = {
  micro: "polymer-micro.html",
  mini: "polymer-mini.html",
  max: "polymer.html",
};

var builds = {
  micro: [artifacts.micro, workdir],
  mini: [artifacts.mini, workdir, [artifacts.micro]],
  max: [artifacts.max, workdir, [artifacts.mini, artifacts.micro]]
};

var depends = {
  micro: ['build-micro'],
  mini: ['micro', 'build-mini'],
  max: ['mini', 'build-max'],
};

['micro', 'mini', 'max'].forEach(function(n) {

  var artifact = artifacts[n];

  gulp.task('strip-'+n, depends[n], function() {
    return gulp.src(['dist/'+artifact])
      .pipe(polyclean.cleanJsComments())
      // Collapse newlines
      .pipe(replace(/\n\s*\n/g, '\n'))
      // Reduce script tags
      .pipe(replace(/<\/script>\s*<script>/g, '\n\n'))
      .pipe(replace('<html><head><meta charset="UTF-8">', ''))
      .pipe(replace('</head><body>\n</body></html>', ''))
      // Collapse leading spaces+tabs.
      .pipe(replace(/^[ \t]+/gm, ''))
      // Restore important newlines
      .pipe(replace(/(<script>)/g, '$1\n'))
      .pipe(replace(/(--><)/g, '-->\n<'))
      // put the out
      .pipe(gulp.dest('dist'))
      ;
  });

  gulp.task('build-'+n, ['clean-'+n], shell.task(vulcanize.apply(this, builds[n])));

  gulp.task('clean-'+n, ['mkdir'], function(cb) {
    del([workdir+'/'+artifact], cb);
  });

});

gulp.task('mkdir', function(cb) {
  fs.exists(workdir, function(exists) {
    exists ? cb() : fs.mkdir(workdir, null, cb);
  });
});

// Default Task
gulp.task('default', ['build']);

// ute
function vulcanize(filename, dstdir, excludes) {
  var cmd = path.join('node_modules', '.bin', 'vulcanize');
  if (excludes && excludes.length > 0) {
    excludes.forEach(function(exclude) {
      cmd = cmd + ' --exclude ' + exclude;
    });
    cmd = cmd + ' --implicit-strip';
  }
  cmd = cmd + ' --strip-comments';
  cmd = cmd + ' ' + filename + ' > ' + path.join(dstdir, filename);
  return cmd;
}

