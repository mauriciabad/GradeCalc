const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const cleanCSS = require('gulp-clean-css');
const minify = require('gulp-minify');
const rename = require("gulp-rename");


gulp.task('css', () =>
  gulp.src('style.css')
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(rename(function (path) {
      path.basename += "-min";
    }))
    .pipe(gulp.dest('./'))
);

gulp.task('js', () =>
  gulp.src('script.js')
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(minify())
    .pipe(gulp.dest('./'))
);
