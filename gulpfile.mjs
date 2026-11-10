import gulp from 'gulp';
import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';

gulp.task('css', () =>
  gulp.src('src/styles/main.css')
    .pipe(autoprefixer({cascade: false}))
    .pipe(cleanCSS())
    .pipe(rename({basename: 'main.min'}))
    .pipe(gulp.dest('dist/styles/'))
);

gulp.task('js', () =>
  gulp.src('src/scripts/script.js')
    .pipe(babel({presets: ['@babel/preset-env']}))
    .pipe(uglify())
    .pipe(rename({basename: 'script.min'}))
    .pipe(gulp.dest('dist/scripts/'))
);

// Polyfills: core-js's prebuilt, minified bundle.
gulp.task('libs', () =>
  gulp.src('node_modules/core-js-bundle/minified.js')
    .pipe(rename({basename: 'libs.min'}))
    .pipe(gulp.dest('dist/scripts/'))
);

gulp.task('html', () =>
  gulp.src(['src/*.html'])
    .pipe(gulp.dest('dist/'))
);

// encoding: false keeps binary files (images, gifs) intact in gulp 5.
gulp.task('static', () =>
  gulp.src(['static/**/*'], {base: 'static', dot: true, encoding: false})
    .pipe(gulp.dest('dist'))
);

gulp.task('assets', () =>
  gulp.src(['src/assets/**/*'], {base: 'src/assets', encoding: false})
    .pipe(gulp.dest('dist'))
);

gulp.task('watch', () => {
  gulp.watch('src/styles/main.css', gulp.series('css'));
  gulp.watch('src/scripts/script.js', gulp.series('js'));
  gulp.watch('src/*.html', gulp.series('html'));
});

gulp.task('build', gulp.parallel('css', 'js', 'libs', 'html', 'static', 'assets'));
gulp.task('default', gulp.series('build'));
