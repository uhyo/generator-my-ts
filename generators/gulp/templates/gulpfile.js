const path = require('path');
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const gulpChanged = require('gulp-changed');

const del = require('del');

const gulpTS = require('gulp-typescript');
const gulpTSlint = require('gulp-tslint');
const typescript = require('typescript');

const LIB_DIR = '{{{lib}}}';
const DIST_LIB = '{{{dist}}}';
const DIST_DECLARATION = '{{{declaration}}}';

const merge2 = DIST_DECLARATION ? require('merge2') : void 0;

const tsProj = gulpTS.createProject('tsconfig.json', {
  typescript,
});
gulp.task('tsc', ()=>{
  const rs = gulp.src(path.join(LIB_DIR, '**', '*.ts{,x}'))
  .pipe(sourcemaps.init())
  .pipe(tsProj());

  if (DIST_DECLARATION){
    return merge2(
      rs.js.pipe(sourcemaps.write()).pipe(gulp.dest(`${DIST_LIB}/`)),
      rs.dts.pipe(gulp.dest(`${DIST_DECLARATION}/`))
    );
  }else{
    return rs.js.pipe(sourcemaps.write()).pipe(gulp.dest(`${DIST_LIB}/`));
  }
});
gulp.task('watch-tsc', ['tsc'], ()=>{
  gulp.watch(path.join(LIB_DIR, '**', '*.ts{,x}'), ['tsc']);
});

gulp.task('tslint', ()=>{
  return gulp.src(path.join(LIB_DIR, '**', '*.ts{,x}'))
  .pipe(gulpTSlint({
    formatter: 'verbose',
  }))
  .pipe(gulpTSlint.report());
});
gulp.task('watch-tslint', ['tslint'], ()=>{
  gulp.watch(path.join(LIB_DIR, '**', '*.ts{,x}'), ['tslint']);
});

gulp.task('default', ['tsc', 'tslint']);
gulp.task('watch', ['watch-tsc', 'watch-tslint']);

gulp.task('clean', ()=>{
  const del_target = [DIST_LIB];
  if (DIST_DECLARATION){
    del_target.push(DIST_DECLARATION);
  }
  return del(del_target);
});
