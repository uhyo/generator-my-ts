'use strict';
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  writing() {
    // Remove unneeded informations
    this.fs.delete(this.destinationPath('.eslintignore'));
    const packagejson = this.destinationPath('package.json');
    const current = this.fs.readJSON(packagejson);
    current.devDependencies.eslint = undefined;
    Object.assign(current.devDependencies, {
      eslint: undefined,
      'eslint-config-xo-space': undefined
    });
    Object.assign(current, {
      eslintConfig: undefined
    });
    if (current.scripts){
      Object.assign(current.scripts, {
        pretest: undefined
      });
    }
    this.fs.writeJSON(packagejson, current);
  }
};

