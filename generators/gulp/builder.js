'use strict';

const extend = require('extend');
const indentString = require('indent-string');
/**
 * Builds gulpfile and dependencnes.
 */
module.exports = class GulpBuilder{
  constructor(generator){
    /**
     * generator instance
     */
    this.generator = generator;
    /**
     * Additional writes to package.json
     */
    this.pkg = {};
    /**
     * Registered module-loadings
     */
    this.loads = [];
    /**
     * Registered constans
     */
    this.constants = [];
    /**
     * Registered task blocks
     */
    this.tasks = [];
  }
  /**
   * Add a write to package.json
   */
  addPkg(name){
    extend(true, this.pkg, this.generator.fs.readJSON(this.generator.templatePath(name)));
  }
  /**
   * Remove a dependency to a package.
   */
  removePkgDep(name, dev){
    const field = 'string' === typeof dev ? dev :
                  dev ? 'devDependencies' : 'dependencies';
    if (this.pkg && this.pkg[field]){
      this.pkg[field][name] = undefined;
    }
  }
  /**
   * Add module-loadings.
   */
  addModule(name, as){
    if (as === undefined){
      as = name;
    }
    this.loads.push({
      name,
      as,
    });
  }
  /**
   * Add separators in module-loading.
   */
  addModuleSeparator(comment){
    if (comment === undefined){
      comment = '----------';
    }
    this.loads.push({
      separator: true,
      comment,
    });
  }
  /**
   * Write gulpfile and package.json.
   */
  write(){
    const g = this.generator;
    // write package.json
    const p = g.destinationPath('package.json');
    if (!g.fs.exists(p)){
      g.fs.writeJSON(p, {});
    }
    g.fs.extendJSON(p, this.pkg);

    // write gulpfile.js
    let gulpfile = `'use strict';\n`;
    // write module-loadings
    for (const m of this.loads){
      if (m.separator){
        gulpfile += `// ${m.comment}\n`;
      }else{
        gulpfile += `const ${m.as} = require('${m.name}');\n`;
      }
    }
    gulpfile += '\n';
    // write constants
    for (const c of this.constants){
      if (c.comment){
        gulpfile += `// ${c.comment}
const ${c.name} = ${c.value};
`;
      }else{
        gulpfile += `const ${c.name} = ${c.value};\n`;
      }
    }
    gulpfile += `const PRODUCTION = process.env.NODE_ENV === 'production';\n`;
    gulpfile += '\n';
    // memo tasks
    const defaultTasks = [];
    const watchTasks = [];
    // write tasks
    for (const b of this.tasks){
      // task block
      let soto = '';
      let nakami = '';
      if (b.comment){
        soto += `// ${b.comment}\n`;
      }
      if (b.taskprepare){
        nakami += `${b.taskprepare}\n`;
      }
      for (const t of b.tasks){
        const options = t.options;
        const ds = options.dependencies ? ', [' + options.dependencies.map(n=> `'${n}'`).join(', ') + ']' : '';
        const bs = t.body ? `, ()=>{
${indentString(t.body, 2)}
}` : '';
        nakami += `gulp.task('${t.name}'${ds}${bs});
`;

        if (options.default){
          defaultTasks.push(t.name);
        }
        if (options.watch){
          watchTasks.push(t.name);
        }
      }
      soto += `{
${indentString(nakami, 2)}}
`;
      gulpfile += soto;
    }
    // defaultとwatchを定義
    if (defaultTasks.length > 0){
      const ts = defaultTasks.map(t=>`'${t}'`).join(', ');
      gulpfile += `gulp.task('default', [${ts}]);\n`;
    }
    if (watchTasks.length > 0){
      const ts = watchTasks.map(t=>`'${t}'`).join(', ');
      gulpfile += `gulp.task('watch', [${ts}]);\n`;
    }
    // write to fs
    g.fs.write(g.destinationPath('gulpfile.js'), gulpfile);
  }
  /**
   * Add constant.
   */
  addConstant(name, value, comment){
    this.constants.push({
      name,
      value: JSON.stringify(value),
      comment,
    });
  }
  /**
   * Add a task block.
   */
  addTaskBlock(comment, taskprepare){
    if (comment === undefined){
      comment = '';
    }
    if (taskprepare === undefined){
      taskprepare = '';
    }
    taskprepare = taskprepare.trim();
    const block = {
      taskprepare,
      tasks: [],
      addTask(name, options, body){
        body = body.trim();
        this.tasks.push({
          name,
          options,
          body,
        });
      },
    };
    this.tasks.push(block);
    return block;
  }
}
