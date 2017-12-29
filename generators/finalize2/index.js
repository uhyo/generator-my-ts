'use strict';
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  writing() {
    // Remove unneeded informations
    this.fs.delete(this.destinationPath('.eslintignore'));
    const packagejson = this.destinationPath('package.json');
    const current = this.fs.readJSON(packagejson);
    Object.assign(current.devDependencies, {
      eslint: undefined,
      'eslint-config-prettier': undefined,
      'eslint-config-xo': undefined,
      'eslint-plugin-prettier': undefined,
    });
    Object.assign(current, {
      eslintConfig: undefined,
      'lint-staged': {
        '*.ts': ['tslint --fix', 'git add'],
        '*.tsx': ['tslint --fix', 'git add'],
        '*.json': ['prettier --write', 'git add'],
      },
      jest: {
        collectCoverage: true,
        mapCoverage: true,
        testEnvironment: 'node',
        transform: {
          '^.+\\.tsx?$': 'ts-jest',
        },
        testRegex: 'lib(?:/.+)?/__tests__/.*\\.ts$',
        moduleFileExtensions: ['js', 'ts'],
      },
    });
    if (current.scripts){
      Object.assign(current.scripts, {
        pretest: undefined
      });
    }
    this.fs.writeJSON(packagejson, current);
  }
};

