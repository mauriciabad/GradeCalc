const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const cleanCSS = require('gulp-clean-css');
const minify = require('gulp-minify');
const rename = require("gulp-rename");
const uglify = require('gulp-uglify');

gulp.task('css', () =>
  gulp.src('style.css')
    .pipe(autoprefixer({
      browsers: ['> 1%', "last 2 versions", 'not dead'],
      cascade: false
    }))
    .pipe(cleanCSS())
    .pipe(rename((path) => {
      path.basename = "style.min";
    }))
    .pipe(gulp.dest('./'))
);

gulp.task('js', () =>
  gulp.src('script.js')
    .pipe(babel({
      presets: ['@babel/preset-env']   
    }))
    .pipe(uglify())
    .pipe(rename((path) => {
      path.basename = "script.min";
    }))
    .pipe(gulp.dest('./'))
);

gulp.task('watch', () => {
  gulp.watch('style.css', gulp.series('css'));
  gulp.watch('script.js', gulp.series('js'));
});

gulp.task('default', gulp.parallel('css','js'));
