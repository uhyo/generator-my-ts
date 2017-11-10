'use strict';
const Generator = require('yeoman-generator');
const path = require('path');

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
  prompting() {
    // TypeScript settings

    // read defaults?
    const tsconfig = this.fs.readJSON(this.destinationPath('tsconfig.json'), {
      compilerOptions: {}
    });
    if (tsconfig.compilerOptions === undefined) {
      tsconfig.compilerOptions = {};
    }
    return this.prompt([
      {
        type: 'list',
        name: 'target',
        message: 'TypeScript target option',
        default: tsconfig.compilerOptions.target || 'es5',
        choices: ['es5', 'es2015', 'es2016', 'es2017', 'esnext']
      },
      {
        type: 'list',
        name: 'module',
        message: 'TypeScript module option',
        default: tsconfig.compilerOptions.module || (({target}) => target === 'es5' ? 'commonjs' : 'es2015'),
        choices: ['commonjs', 'es2015']
      }
    ]).then(props => {
      this.props = props;
    });
  }
  default() {
    // Install required libraries
    this.npmInstall([
      'typescript'
    ], {
      'save-dev': true
    });
  }
  writing() {
    const lib = ['dom'];
    // targetに応じてlibを構成
    switch (this.props.target){
      case 'es5': {
        lib.push('es5');
        break;
      }
      case 'es2015': {
        lib.push('es2015', 'dom.iterable');
        break;
      }
      case 'es2016': {
        lib.push('es2016', 'dom.iterable');
        break;
      }
      case 'es2017': {
        lib.push('es2017', 'dom.iterable');
        break;
      }
      case 'esnext': {
        lib.push('esnext', 'dom.iterable');
        break;
      }
    }
    // Write tsconfig.json
    const tsconfig = this.fs.readJSON(this.templatePath('tsconfig.json'));
    Object.assign(tsconfig.compilerOptions, {
      declaration: this.props.declaration,
      module: this.props.module,
      target: this.props.target
      lib,
    });
    Object.assign(tsconfig, {
      include: [
        path.join(this.options.lib, '**', '*.ts')
      ]
    });
    this.fs.writeJSON(this.destinationPath('tsconfig.json'), tsconfig);

    // Write package.json
    this.fs.extendJSON(this.destinationPath('package.json'), this.fs.readJSON(this.templatePath('package.json')));

    // Write tslint.json
    this.fs.copy(this.templatePath('tslint.json'), this.destinationPath('tslint.json'));

    // Write editorconfig
    const editorconfig = this.destinationPath('.editorconfig');
    if (!this.fs.exists(editorconfig)) {
      this.fs.write(editorconfig, '');
    }
    if (!/^\[\*\.\{ts,tsx\}\]$/m.test(this.fs.read(editorconfig))){
      this.fs.append(editorconfig, `[*.{ts,tsx}]
indent_style = space
indent_size = 4
`);
    }
  }
};

