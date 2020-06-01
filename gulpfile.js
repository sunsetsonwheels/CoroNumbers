const { series, parallel, src, dest } = require('gulp')
const log = require('fancy-log')
const plumber = require('gulp-plumber')
const rm = require('del')
const rename = require('gulp-rename')
const minifyJS = require('gulp-terser')
const minifyJSON = require('gulp-jsonminify')
const minifyCSS = require('gulp-clean-css')
const minifyHTML = require('gulp-htmlmin')
const zip = require('gulp-zip')
const APP_VERSION = require('./package.json').version

const SOURCE_FOLDER = 'src/'
const BUILD_FOLDER = 'dist/'
const DEPLOY_BUILD_FOLDER = BUILD_FOLDER + 'deploy/'
const OMNISD_BUILD_FOLDER = BUILD_FOLDER + 'omnisd/'

const BUILD_TARGET = 'stable'

const FPATHS = {
  js: {
    src: SOURCE_FOLDER + 'js/**/*.js',
    src_min: SOURCE_FOLDER + 'js/**/*.min.js',
    dest: DEPLOY_BUILD_FOLDER + 'js/'
  },
  json: {
    src: SOURCE_FOLDER + 'tiles/worldgrid.json',
    dest: DEPLOY_BUILD_FOLDER + 'tiles/'
  },
  tiles: {
    src: [SOURCE_FOLDER + 'tiles/**/*.json', '!' + SOURCE_FOLDER + 'tiles/worldgrid.json'],
    dest: DEPLOY_BUILD_FOLDER + 'tiles/'
  },
  css: {
    src: SOURCE_FOLDER + 'css/**/*.css',
    dest: DEPLOY_BUILD_FOLDER + 'css/'
  },
  html: {
    src: SOURCE_FOLDER + '*.html',
    dest: DEPLOY_BUILD_FOLDER
  },
  icons: {
    src: SOURCE_FOLDER + 'icons/**/*.png',
    dest: DEPLOY_BUILD_FOLDER + 'icons/'
  },
  locales: {
    src: SOURCE_FOLDER + 'locales/**/*.properties',
    dest: DEPLOY_BUILD_FOLDER + 'locales/'
  },
  manifest: {
    src: SOURCE_FOLDER + 'manifest.json',
    dest: DEPLOY_BUILD_FOLDER
  },
  omnisd_manifests: {
    src: './metadata.json',
    dest: OMNISD_BUILD_FOLDER + 'tmp/'
  }
}

function onErr (err) {
  const constructMessage = 'An error occured in gulp:\n\n' + err.toString()
  log.error(constructMessage)
  process.exit(-1)
}

function jsTask () {
  return src(FPATHS.js.src)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(minifyJS())
    .pipe(plumber.stop())
    .pipe(dest(FPATHS.js.dest))
}

function tilesTask () {
  return src(FPATHS.tiles.src)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(plumber.stop())
    .pipe(dest(FPATHS.tiles.dest))
}

function jsonTask () {
  return src(FPATHS.json.src)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(minifyJSON())
    .pipe(dest(FPATHS.json.dest))
}

function jsMinTask () {
  return src(FPATHS.js.src_min)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(plumber.stop())
    .pipe(dest(FPATHS.js.dest))
}

function cssTask () {
  return src(FPATHS.css.src)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(minifyCSS())
    .pipe(plumber.stop())
    .pipe(dest(FPATHS.css.dest))
}

function htmlTask () {
  return src(FPATHS.html.src)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(minifyHTML())
    .pipe(plumber.stop())
    .pipe(dest(FPATHS.html.dest))
}

function localeTask () {
  return src(FPATHS.locales.src)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(plumber.stop())
    .pipe(dest(FPATHS.locales.dest))
}

function iconsTask () {
  return src(FPATHS.icons.src)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(plumber.stop())
    .pipe(dest(FPATHS.icons.dest))
}

function manifestTask () {
  return src(FPATHS.manifest.src)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(minifyJSON())
    .pipe(rename('manifest.webapp'))
    .pipe(plumber.stop())
    .pipe(dest(FPATHS.manifest.dest))
}

function zipDeployTask () {
  return src(DEPLOY_BUILD_FOLDER + '**/*')
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(zip('application.zip'))
    .pipe(plumber.stop())
    .pipe(dest(BUILD_FOLDER))
}

function cpOmniSDManifestsTask () {
  return src(FPATHS.omnisd_manifests.src)
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(plumber.stop())
    .pipe(dest(FPATHS.omnisd_manifests.dest))
}

function zipOmniSDTask () {
  return src([BUILD_FOLDER + 'application.zip', OMNISD_BUILD_FOLDER + 'tmp/*'])
    .pipe(plumber({ errorHandler: onErr }))
    .pipe(zip('covid19numbers-' + APP_VERSION + '-' + BUILD_TARGET + '-omnisd.zip'))
    .pipe(plumber.stop())
    .pipe(dest(OMNISD_BUILD_FOLDER))
}

function postOmniSDTask () {
  return rm(OMNISD_BUILD_FOLDER + 'tmp')
}

function cleanBuildAll () {
  return rm([BUILD_FOLDER + '*'])
}

function cleanBuildDeploy () {
  return rm([DEPLOY_BUILD_FOLDER])
}

function cleanBuildOmniSD () {
  return rm([OMNISD_BUILD_FOLDER])
}

const DEFAULT_BUILD_TASKS = parallel(jsTask, series(tilesTask, jsonTask), jsMinTask, cssTask, htmlTask, localeTask, iconsTask, manifestTask)

exports.clean = cleanBuildAll
exports.clean_deploy = cleanBuildDeploy
exports.clean_omnisd = cleanBuildOmniSD

exports.default = series(cleanBuildAll, DEFAULT_BUILD_TASKS, parallel(zipDeployTask, cpOmniSDManifestsTask), zipOmniSDTask, postOmniSDTask)
