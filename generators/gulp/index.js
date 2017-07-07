'use strict';
const Generator = require('yeoman-generator');

const GulpBuilder = require('./builder');

module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options);

    this.option('lib', {
      type: String,
      required: true,
      message: 'Source directory'
    });
    this.option('dist', {
      type: String,
      required: true,
      message: 'Distribution directory'
    });
    this.option('declaration', {
      type: Boolean,
      required: false,
      default: true,
      message: 'Emit declaration files'
    });
    this.option('declarationdir', {
      type: String,
      required: this.options.declaration,
      message: 'Path of declartion directory'
    });
    this.option('bundle', {
      type: String,
      required: false,
      default: 'none',
      message: 'Bundler',
    });
    this.option('distinterm', {
      type: String,
      required: this.options.bundle !== 'none',
      message: 'Intermediate code directory',
    });
    this.option('bundlemodule', {
      type: String,
      required: this.options.bundle === 'rollup',
      message: 'Module name of bundle',
    });
  }
  writing() {
    const builder = new GulpBuilder(this);
    this._init(builder);

    this._ts(builder);

    if (this.options.bundle === 'rollup'){
      this._rollup(builder);
    }

    this._finalize(builder);

    builder.write();
  }
  /**
   * Register Basic gulp features to builder.
   */
  _init(builder){
    builder.addPkg('package-base.json');
    builder.addModule('path');
    builder.addModule('gulp');
    builder.addModule('gulp-sourcemaps', 'sourcemaps');
    builder.addModule('gulp-changed', 'gulpChanged');
    if (this.options.declaration){
      builder.addModule('merge2');
    }else{
      builder.removePkgDep('merge2', true);
    }

    // dist of ts compiling.
    const tsdist = this.options.bundle === 'none' ? this.options.dist : this.options.distinterm;

    builder.addConstant('LIB_DIR', this.options.lib);
    builder.addConstant('TS_DIST_LIB', tsdist);
    builder.addConstant('DIST_DECLARATION', this.options.declaration ? this.options.declarationdir : '');
    builder.addConstant('DIST_LIB', this.options.dist);
  }
  /**
   * Register misc of gulp tasks.
   */
  _finalize(builder){
    builder.addModule('del');

    let del_target = 'DIST_LIB';
    if (this.options.bundle !== 'none'){
      del_target += ', TS_DIST_LIB';
    }
    builder.addTaskBlock().addTask('clean', {}, `
const del_target = [${del_target}];
if (DIST_DECLARATION){
  del_target.push(DIST_DECLARATION);
}
return del(del_target);
`);
  }
  /**
   * Register TypeScript features.
   */
  _ts(builder){
    builder.addModuleSeparator('TypeScript');
    builder.addModule('gulp-typescript', 'gulpTS');
    builder.addModule('gulp-tslint', 'gulpTSlint');
    builder.addModule('typescript');
    const block = builder.addTaskBlock('TypeScript', `
const tsProj = gulpTS.createProject('tsconfig.json', {
  typescript,
});
`);
    block.addTask('tsc', { default: true }, `
const rs = gulp.src(path.join(LIB_DIR, '**', '*.ts{,x}'))
.pipe(sourcemaps.init())
.pipe(tsProj());

if (DIST_DECLARATION){
  return merge2(
    rs.js.pipe(sourcemaps.write()).pipe(gulp.dest(TS_DIST_LIB)),
    rs.dts.pipe(gulp.dest(DIST_DECLARATION))
  );
}else{
  return rs.js.pipe(sourcemaps.write()).pipe(gulp.dest(TS_DIST_LIB));
}
`);
    block.addTask('watch-tsc', {
      dependencies: ['tsc'],
      watch: true,
    }, `gulp.watch(path.join(LIB_DIR, '**', '*.ts{,x}'), ['tsc']);`);

    block.addTask('tslint', {
      default: true,
    }, `
return gulp.src(path.join(LIB_DIR, '**', '*.ts{,x}'))
.pipe(gulpTSlint({
  formatter: 'verbose',
}))
.pipe(gulpTSlint.report());
`);
    block.addTask('watch-tslint', {
      dependencies: ['tslint'],
      watch: true,
    }, `gulp.watch(path.join(LIB_DIR, '**', '*.ts{,x}'), ['tslint']);`);
  }
  /**
   * Register rollup features.
   */
  _rollup(builder){
    builder.addPkg('package-rollup.json');
    builder.addModuleSeparator('Rollup');
    builder.addModule('rollup');
    builder.addModule('rollup-stream', 'rollupStream');
    builder.addModule('vinyl-source-stream', 'source');
    builder.addModule('vinyl-buffer', 'buffer');
    builder.addModule('gulp-uglify', 'uglify');

    builder.addConstant('BUNDLE_MODULE_NAME', this.options.bundlemodule);
    builder.addConstant('BUNDLE_NAME', 'bundle.js');

    const block = builder.addTaskBlock('Rollup', `
let rollupCache;
function runRollup(){
  let main = rollupStream({
    entry: path.join(TS_DIST_LIB, 'index.js'),
    format: 'umd',
    moduleName: BUNDLE_MODULE_NAME,
    sourceMap: 'inline',
    rollup,
    cache: rollupCache,
  })
  .on('bundle', bundle=> rollupCache = bundle)
  .pipe(source(BUNDLE_NAME));

  if (PRODUCTION){
    main = main.pipe(buffer()).pipe(uglify());
  }

  return main.pipe(gulp.dest(DIST_LIB));
}
`);
    block.addTask('bundle-main', {}, ` return runRollup();`);
    block.addTask('bundle', {
      dependencies: ['tsc'],
      default: true,
    }, `return runRollup();`);
    block.addTask('watch-bundle', {
      dependencies: ['bundle'],
      watch: true,
    }, `gulp.watch(path.join(TS_DIST_LIB, '**', '*.js'), ['bundle-main']);`);
  }
};
