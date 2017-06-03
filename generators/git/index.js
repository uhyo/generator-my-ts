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
    // Write .gitignore
    const content = `
# Distribution files
${this.options.dist}
${this.options.declaration ? this.options.declarationdir : ''}
`;
    const gitignore = this.destinationPath('.gitignore');
    if (this.fs.exists(gitignore)) {
      const c = this.fs.read(gitignore);
      if (!/^# Distribution files$/m.test(c)) {
        this.fs.append(this.destinationPath('.gitignore'), content);
      }
    } else {
      this.fs.write(this.destinationPath('.gitignore'), content);
    }
  }
};
