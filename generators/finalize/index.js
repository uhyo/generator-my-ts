'use strict';
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  default() {
    // Double nesting, to come later than generator-node:eslint
    this.composeWith(require.resolve('../finalize2'));
  }
};

