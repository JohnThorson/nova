// Require our dependencies
const autoprefixer  = require( 'autoprefixer' );
const bourbon       = require( 'bourbon' ).includePaths;
const browserSync   = require( 'browser-sync' );
const cssnano       = require( 'gulp-cssnano' );
const del           = require( 'del' );
const eslint        = require( 'gulp-eslint' );
const gulp          = require( 'gulp' );
const gutil         = require( 'gulp-util' );
const image         = require('gulp-image');
const mqpacker      = require( 'css-mqpacker' );
const neat          = require( 'bourbon-neat' ).includePaths;
const notify        = require( 'gulp-notify' );
const path          = require("path");
const plumber       = require( 'gulp-plumber' );
const postcss       = require( 'gulp-postcss' );
const reload        = browserSync.reload;
const rename        = require( 'gulp-rename' );
const sass          = require( 'gulp-sass' );
const sassdoc       = require('sassdoc');
const sassLint      = require( 'gulp-sass-lint' );
const source        = require('vinyl-source-stream');
const sourcemaps    = require( 'gulp-sourcemaps' );
const sort          = require( 'gulp-sort' );
const uglify        = require( 'gulp-uglify' );
const webpack       = require("webpack");
const webpackConfig = require("./webpack.config.js");


// Set assets paths.
const sitename = 'onbase';

const inputPaths = {
  'fonts'   : './src/fonts/**',
  'images'  : './src/images/**',
  'markup'  : './src/html/**',
  'sass'    : './src/scss/**/*.scss',
  'scripts' : './src/javascript/app.js'
};

const outputPaths = {
  'fonts'   : './public/assets/' + sitename + '/fonts',
  'images'  : './public/assets/' + sitename + '/images',
  'markup'  : './public',
  'css'    : './public/assets/' + sitename + '/stylesheets',
  'scripts' : './public/assets/' + sitename + '/javascript'
};

const  sassdocOptions = {
  dest           : './public/assets/' + sitename + '/sassdoc'
  };

/**
 * Delete style.css and style.min.css before we minify and optimize
 */
gulp.task( 'clean:styles', function () {
  return del( [ outputPaths.css + '/style.css', outputPaths.css + '/style.min.css' ] );
} );

/**
 * Delete bundle.js before we minify and optimize
 */
gulp.task( 'clean:scripts', function () {
  return del( [ outputPaths.scripts + '/bundle.js' ] );
} );

/**
 * Delete all markup files created by the build-html task
 */
gulp.task( 'clean:markup', function () {
  return del( [ outputPaths.markup + '/**/*', '!./public/assets', '!./public/assets/**/*' ] );
} );

/**
 * Delete all font files created by the build-fonts task
 */
gulp.task( 'clean:fonts', function () {
  return del( [ outputPaths.fonts + '/**/*' ] );
} );

/**
 * Delete all image files created by the build-images task
 */
gulp.task( 'clean:images', function () {
  return del( [ outputPaths.images + '/**/*' ] );
} );

/**
 * Delete the public site - full cleanse
 */
gulp.task( 'clean:all', function () {
  return del( [ outputPaths.markup + '/**/*' ] );
} )

/**
 * Handle errors and alert the user.
 */
function handleErrors () {
  var args = Array.prototype.slice.call( arguments );

  notify.onError( {
    'title': 'Task Failed [<%= error.message %>',
    'message': 'See console.',
    'sound': 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
  } ).apply( this, args );

  gutil.beep(); // Beep 'sosumi' again

  // Prevent the 'watch' task from stopping
  this.emit( 'end' );
}


// define the default task and add the watch task to it
gulp.task('default', ['watch']);

// publish fonts
gulp.task('build-fonts', [ 'clean:fonts' ], function () {
  gulp.src(inputPaths.fonts)
    .pipe(gulp.dest(outputPaths.fonts));
});

/**
 * Optimize images for Web use. 
 *
 * https://www.npmjs.com/package/gulp-image
 */
gulp.task('build-images', [ 'clean:images' ], function () {
  return gulp.src(inputPaths.images)
    .pipe(image({
      pngquant: true,
      optipng: false,
      zopflipng: true,
      advpng: true,
      jpegRecompress: false,
      jpegoptim: true,
      mozjpeg: true,
      gifsicle: true,
      svgo: true
    }))
    .pipe(gulp.dest(outputPaths.images));
});

// publish html
gulp.task('build-html', [ 'clean:markup' ], function () {
  gulp.src(inputPaths.markup)
    .pipe(gulp.dest(outputPaths.markup));
});

/**
 * Compile Sass and run stylesheet through PostCSS.
 *
 * https://www.npmjs.com/package/gulp-sass
 * https://www.npmjs.com/package/gulp-postcss
 * https://www.npmjs.com/package/gulp-autoprefixer
 * https://www.npmjs.com/package/css-mqpacker
 */
gulp.task( 'postcss', [ 'clean:styles' ], function () {
  return gulp.src( inputPaths.sass )

  // Deal with errors.
  .pipe( plumber( {'errorHandler': handleErrors} ) )

  // Wrap tasks in a sourcemap.
  .pipe( sourcemaps.init() )

    // Compile Sass using LibSass.
    .pipe( sass( {
      'includePaths': [].concat( bourbon, neat ),
      'errLogToConsole': true,
      'outputStyle': 'expanded' // Options: nested, expanded, compact, compressed
    } ) )

    // Parse with PostCSS plugins.
    .pipe( postcss( [
      autoprefixer( {
        'browsers': [ 'last 2 version' ]
      } ),
      mqpacker( {
        'sort': true
      } )
    ] ) )

  // Create sourcemap.
  .pipe( sourcemaps.write() )

  // Create styles.css.
  .pipe( gulp.dest( outputPaths.css) )
  .pipe( browserSync.stream() );
} );

/**
 * Minify and optimize style.css.
 *
 * https://www.npmjs.com/package/gulp-cssnano
 */
gulp.task( 'build-css', [ 'postcss' ], function () {
  return gulp.src( outputPaths.css + 'styles.css' )
  .pipe( plumber( {'errorHandler': handleErrors} ) )
  .pipe( cssnano( {
    'safe': true // Use safe optimizations
  } ) )
  .pipe( rename( 'style.min.css' ) )
  .pipe( gulp.dest( outputPaths.css ) )
  .pipe( browserSync.stream() );
} );

/**
 * Sass Documenting.
 *
 * https://www.npmjs.com/package/gulp-sassdoc
 */
gulp.task('sassdoc', function () {
  return gulp
    .src(inputCss)
    .pipe(sassdoc(sassdocOptions))
    .resume();
});

/**
 * Sass linting.
 *
 * https://www.npmjs.com/package/sass-lint
 */
gulp.task( 'sass:lint', function () {
  gulp.src( [
    inputCss,
    '!src/scss/bootstrap/**',
    '!src/scss/_bootstrap*.scss',
    '!node_modules/**'
  ] )
  .pipe( sassLint() )
  .pipe( sassLint.format() )
  .pipe( sassLint.failOnError() );
} );

/**
 * Compile and bundle JavaScript
 *
 * https://www.npmjs.com/package/webpack
 */
gulp.task('build-js', [ 'clean:scripts' ], function(callback) {
  // modify some webpack config options
  var myConfig = Object.create(webpackConfig);
  myConfig.output = {
      path: path.resolve(outputPaths.scripts),
      filename: "bundle.js",
      publicPath: "public"
  };
  myConfig.plugins = myConfig.plugins.concat(
    new webpack.DefinePlugin({
      "process.env": {
        // This has effect on the react lib size
        "NODE_ENV": JSON.stringify("production")
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  );

  // run webpack
  webpack(myConfig, function(err, stats) {
    if(err) throw new gutil.PluginError("webpack:build", err);
    gutil.log("[webpack:build]", stats.toString({
      colors: true
    }));
    callback();
  });
});

/**
 * Javascript linting.
 *
 * https://www.npmjs.com/package/gulp-eslint
 */
gulp.task( 'js:lint', function () {
  return gulp.src( [
    inputJs,
    '!src/javascript/bootstrap*.js',
    '!src/javascript/bootstrap/*.js',
    '!src/javascript/vendor/*.js',
    '!gulpfile.js',
    '!node_modules/**'
  ] )
  .pipe( eslint() )
  .pipe( eslint.format() )
  .pipe( eslint.failAfterError() );
} );


/**
 * Process tasks and reload browsers on file changes.
 *
 * https://www.npmjs.com/package/browser-sync
 */
gulp.task( 'watch', function () {
  // Kick off BrowserSync.
  browserSync( {
    'open': false,             // Open project in a new tab?
    'injectChanges': true,     // Auto inject changes instead of full reload
    'proxy': sitename + '.dev',    // Use http://_s.com:3000 to use BrowserSync
    'watchOptions': {
      'debounceDelay': 1000  // Wait 1 second before injecting
    }
  } );

  // Run tasks when files change.
  gulp.watch( inputPaths.fonts, [ 'fonts' ] );
  gulp.watch( inputPaths.sass, [ 'styles' ] );
  gulp.watch( inputPaths.scripts, [ 'scripts' ] );
  gulp.watch( inputPaths.images, [ 'images' ] );
  gulp.watch( inputPaths.markup, [ 'markup' ] );
} );

/**
 * Create individual tasks.
 */
gulp.task( 'markup', [ 'build-html' ], browserSync.reload );
gulp.task( 'scripts', [ 'build-js' ] );
gulp.task( 'styles', [ 'build-css' ] );
gulp.task( 'fonts', [ 'build-fonts' ] );
gulp.task( 'images', [ 'build-images' ] );
gulp.task( 'lint', [ 'sass:lint', 'js:lint' ] );
gulp.task( 'build:all', [ 'fonts', 'styles', 'scripts', 'images', 'markup'] );
