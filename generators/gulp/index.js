'use strict';
const Generator = require('yeoman-generator');

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
      required: this.option.declaration,
      message: 'Path of declartion directory'
    });
  }
  writing() {
    const gulpfile = this.fs.read(this.templatePath('gulpfile.js'));
    // Replacement
    const dict = {
      lib: this.options.lib,
      dist: this.options.dist,
      declaration: this.options.declaration ? this.options.declarationdir : ''
    };
    const gulpfile2 = gulpfile.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => dict[key] || '');

    this.fs.write(this.destinationPath('gulpfile.js'), gulpfile2);

    // Install required libraries
    const packagejson = this.destinationPath('package.json');
    if (!this.fs.exists(packagejson)) {
      this.fs.writeJSON(packagejson, {});
    }
    const neededPkgs = this.fs.readJSON(this.templatePath('package.json'));
    if (!this.options.declaration) {
      neededPkgs.devDependencies.merge2 = undefined;
    }
    this.fs.extendJSON(packagejson, neededPkgs);
  }
};
