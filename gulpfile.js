const gulp = require('gulp');
const concat = require('gulp-concat-css');
const plumber = require('gulp-plumber');
const del = require('del');
const browserSync = require('browser-sync').create();
const imagemin = require('gulp-imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');
const webp = require('gulp-webp');
const avif = require('gulp-avif');
const autoprefixer = require('autoprefixer');
const mediaquery = require('postcss-combine-media-query');
const cssnano = require('cssnano');
const htmlMinify = require('html-minifier');

// --- Serve ---
function serve() {
  browserSync.init({
    server: { baseDir: './dist' },
    notify: false,
  });
}

// --- HTML ---
function html() {
  const options = {
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    collapseWhitespace: true,
    minifyCSS: true,
    keepClosingSlash: true,
  };
  return gulp
    .src('src/**/*.html')
    .pipe(plumber())
    .on('data', function (file) {
      const buferFile = Buffer.from(
        htmlMinify.minify(file.contents.toString(), options)
      );
      return (file.contents = buferFile);
    })
    .pipe(gulp.dest('dist/'))
    .pipe(browserSync.reload({ stream: true }));
}

// --- CSS ---
function css() {
  const plugins = [autoprefixer(), mediaquery(), cssnano()];
  return gulp
    .src('src/blocks/**/*.css')
    .pipe(plumber())
    .pipe(concat('bundle.css'))
    .pipe(postcss(plugins))
    .pipe(gulp.dest('dist/'))
    .pipe(browserSync.reload({ stream: true }));
}

// --- Images (оптимизация + WEBP + AVIF) ---
function images() {
  // Оптимизация оригиналов
  gulp
    .src('src/images/**/*.{jpg,jpeg,png,svg,gif,ico}')
    .pipe(
      imagemin([
        mozjpeg({ quality: 75, progressive: true }),
        pngquant({ quality: [0.7, 0.85] }),
        imagemin.svgo({
          plugins: [{ removeViewBox: false }, { cleanupIDs: true }],
        }),
        imagemin.gifsicle({ interlaced: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
      ])
    )
    .pipe(gulp.dest('dist/images'))
    .pipe(browserSync.reload({ stream: true }));

  // WEBP
  gulp
    .src('src/images/**/*.{jpg,jpeg,png}')
    .pipe(webp({ quality: 75 }))
    .pipe(gulp.dest('dist/images'))
    .pipe(browserSync.reload({ stream: true }));

  // AVIF
  return gulp
    .src('src/images/**/*.{jpg,jpeg,png}')
    .pipe(avif({ quality: 50 }))
    .pipe(gulp.dest('dist/images'))
    .pipe(browserSync.reload({ stream: true }));
}

// --- Fonts ---
function fonts() {
  return gulp
    .src('src/fonts/**/*.{woff,woff2,ttf,otf}')
    .pipe(gulp.dest('dist/fonts'))
    .pipe(browserSync.reload({ stream: true }));
}

// --- Video ---
function video() {
  return gulp
    .src(
      'src/videos/**/*.{mp4,webm,ogg,ogv,mov,m4v,avi,mkv,flv,f4v,3gp,3g2,ts,mpeg,mpg,m2ts,vob,wmv,asf}'
    )
    .pipe(gulp.dest('dist/videos'))
    .pipe(browserSync.reload({ stream: true }));
}

// --- Clean ---
function clean() {
  return del('dist');
}

// --- Watch ---
function watchFiles() {
  gulp.watch('src/**/*.html', html);
  gulp.watch('src/blocks/**/*.css', css);
  gulp.watch('src/images/**/*.{jpg,jpeg,png,svg,gif,ico}', images);
  gulp.watch('src/fonts/**/*.{woff,woff2,ttf,otf}', fonts);
  gulp.watch(
    'src/videos/**/*.{mp4,webm,ogg,ogv,mov,m4v,avi,mkv,flv,f4v,3gp,3g2,ts,mpeg,mpg,m2ts,vob,wmv,asf}',
    video
  );
}

// --- Build ---
const build = gulp.series(
  clean,
  gulp.parallel(html, css, images, fonts, video)
);

// --- Watch + Serve ---
const dev = gulp.parallel(build, watchFiles, serve);

// --- Exports ---
exports.html = html;
exports.css = css;
exports.images = images;
exports.fonts = fonts;
exports.video = video;
exports.clean = clean;

exports.build = build;
exports.watchapp = dev;
exports.default = dev;
