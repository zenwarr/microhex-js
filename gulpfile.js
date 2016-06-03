"use strict";

var PRODUCTION = true;

var gulp = require('gulp');
var stylus = require('gulp-stylus');
var watch = require('gulp-watch');
var webpack = require('webpack-stream');
var ts = require('gulp-typescript');

/*
 * Compile styles using Stylus preprocessor
 */

gulp.task('stylus', function() {
  gulp.src('client_src/styles/*.styl')
      .pipe(stylus({}))
      .pipe(gulp.dest('client/css'));
});

/*
 * Copy html files to output directory
 */

gulp.task('html', function() {
  gulp.src('client_src/*.html')
      .pipe(gulp.dest('client/'));
});

/*
 * Copy images to output directory
 */

gulp.task('img', function() {
  gulp.src('client_src/img/*.*')
      .pipe(gulp.dest('client/img/'));
});

/*
 * Compile application base code with webpack
 */

gulp.task('app', function() {
  const WEBPACK_CONFIG = PRODUCTION ? 'app_production' : 'app_development';

  gulp.src('src/app.ts')
      .pipe(webpack(require(`./webpack/${WEBPACK_CONFIG}.config.js`)))
      .pipe(gulp.dest('.'));
});

/*
 * Compile application client code with webpack
 */

gulp.task('client', function() {
  const WEBPACK_CONFIG = PRODUCTION ? 'client_production' : 'client_development';

  gulp.src('client_src/js/app.ts')
      .pipe(webpack(require(`./webpack/${WEBPACK_CONFIG}.config.js`)))
      .pipe(gulp.dest('.'));
});

/*
 * Composite tasks for building entire application
 */

gulp.task('default', function() {
  gulp.start('stylus', 'html', 'img', 'app', 'client');
});

gulp.task('default:dev', function() {
  PRODUCTION = false;
  gulp.start('default');
});

gulp.task('watch', function() {
  gulp.start('default:dev');

  watch('client_src/styles/*.styl', function() {
    gulp.start('stylus');
  });

  watch('client_src/*.html', function() {
    gulp.start('html');
  });

  watch('client_src/img/*.*', function() {
    gulp.start('img');
  });

  watch('src/**', function() {
    gulp.start('app');
  });
});
