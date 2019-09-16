const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const cleanCSS = require('gulp-clean-css');
const minify = require('gulp-minify');
const rename = require("gulp-rename");
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const babelify = require('babelify');
// const sourcemaps  = require('gulp-sourcemaps');

gulp.task('css', () =>
  gulp.src('src/styles/main.css')
    .pipe(autoprefixer({
      browsers: ['> 1%', "last 2 versions", 'not dead'],
      cascade: false
    }))
    .pipe(cleanCSS())
    .pipe(rename((path) => {
      path.basename = "main.min";
    }))
    .pipe(gulp.dest('dist/styles/'))
);

gulp.task('js', () =>
  gulp.src('src/scripts/script.js')
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(uglify())
    .pipe(rename((path) => {
      path.basename = "script.min";
    }))
    .pipe(gulp.dest('dist/scripts/'))
);

gulp.task('libs', () =>
  browserify({entries: 'src/scripts/libs.js', debug: true})
      .transform("babelify", { presets: ["@babel/preset-env"] })
      .bundle()
      .pipe(source('src/scripts/libs.js'))
      .pipe(buffer())
      // .pipe(sourcemaps.init())
      .pipe(uglify())
      // .pipe(sourcemaps.write('./maps'))
      .pipe(rename((path) => {
        path.basename = "libs.min";
      }))
      .pipe(gulp.dest('dist/scripts/'))
);

gulp.task('watch', () => {
  gulp.watch('src/styles/main.css', gulp.series('css'));
  gulp.watch('src/scripts/script.js', gulp.series('js'));
});

gulp.task('default', gulp.parallel('css','js','libs'));
gulp.task('build', gulp.parallel('css','js','libs'));
