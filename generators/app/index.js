'use strict';
const path = require('path');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the kickass ' + chalk.red('generator-my-ts') + ' generator!'
    ));

    const prompts = [{
      type: 'input',
      name: 'name',
      message: 'Project name',
      default: this.appname
    }, {
      type: 'input',
      name: 'lib',
      message: 'Source directory',
      default: 'lib'
    }, {
      type: 'input',
      name: 'dist',
      message: 'Distribution directory',
      default: 'dist'
    }, {
      type: 'confirm',
      name: 'declaration',
      message: 'Emit TypeScript declaration files',
      default: false
    }, {
      type: 'input',
      name: 'declarationdir',
      message: 'Declaration files directory',
      default: 'dist-typing',
      when: ({declaration}) => declaration
    }];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }
  default() {
    // Normalize options
    this.props.lib = path.normalize(this.props.lib + '/');
    this.props.dist = path.normalize(this.props.dist + '/');
    if (this.props.declarationdir) {
      this.props.declarationdir = path.normalize(this.props.declarationdir + '/');
    }
    // Node generator
    this.composeWith(require.resolve('generator-node/generators/app'), {
      boilerplate: false,
      cli: false,
      editorconfig: true,
      git: true,
      license: true,
      travis: true,
      name: this.props.name
    });
    // Internal gulp generator
    this.composeWith(require.resolve('../gulp'), {
      lib: this.props.lib,
      dist: this.props.dist,
      declaration: this.props.declaration,
      declarationdir: this.props.declarationdir
    });
    // Git setting
    this.composeWith(require.resolve('../git'), {
      lib: this.props.lib,
      dist: this.props.dist,
      declaration: this.props.declaration,
      declarationdir: this.props.declarationdir
    });
    // Typescript setting
    this.composeWith(require.resolve('../typescript'), {
      lib: this.props.lib,
      dist: this.props.dist,
      declaration: this.props.declaration,
      declarationdir: this.props.declarationdir
    });
    this.composeWith(require.resolve('../finalize'));
  }

  writing() {
    // Possible entry point
    this.fs.write(this.destinationPath(path.join(this.props.lib, 'index.ts')), '');
  }

  install() {
    this.installDependencies({
      bower: false
    });
  }
};
