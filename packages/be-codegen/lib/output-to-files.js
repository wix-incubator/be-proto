const fs = require('fs-extra');
const path = require('path');

module.exports = {
  outputToFiles,
  toRequireLines
};

function outputToFiles(outputDir, output = console) {

  let fulfillCallback;
  let rejectCallback;

  const pendingPromises = [];
  const completePromise = new Promise((fulfill, reject) => {
    fulfillCallback = fulfill;
    rejectCallback = reject;
  })

  return {
    add(code) {
      const relativeBasename = code.namespace ? `${code.namespace}/${code.name}` : `${code.name}`;
      const promise = outputFile(outputDir, relativeBasename, code).then(() => output.log(`== Generated ${relativeBasename}`));

      pendingPromises.push(promise);
    },
    error(e) {
      rejectCallback(e);
    },
    complete() {
      fulfillCallback();
    },
    async done() {
      await completePromise;
      await Promise.all(pendingPromises);
      output.log('== Complete');
    }
  }
};

async function outputFile(outputDir, relativeBasename, code) {
  const extension = code.json ? 'json' : (code.js ? 'js' : 'js');
  const filename = `${relativeBasename}.${extension}`;
  const filepath = path.join(outputDir, filename);

  const fileContents = fileContentsFor(code, filename, extension);

  if (code.ts) {
    const dtsFilename = `${relativeBasename}.d.ts`;
    const dtsFilepath = path.join(outputDir, dtsFilename);

    await fs.outputFile(dtsFilepath, fileContentsFor(code, dtsFilename, 'd.ts'));
  }

  return fs.outputFile(filepath, fileContents);
}

function fileContentsFor(code, contextPath, extension) {
  if (extension === 'js') {
    const imports = toRequireLines(code.js.imports, contextPath).join('\r\n');

    return `${imports}

    ${code.js.code}`;
  } else if (extension === 'd.ts') {
    const imports = toImportLines(code.ts.imports, contextPath).join('\r\n');

    return `${imports}

    declare namespace ${code.namespace} {
      ${code.ts.code}
    }
    
    export = ${code.namespace};`;
  } else if (extension === 'json') {
    return JSON.stringify(code.json);
  }
}

function toRequireLines(jsImports, contextPath) {
  return jsImports.map(({name, namespace, packageName}) => packageName ?
    `const {${name}} = require('${packageName}');` :
    `const {${name}} = require('${packageNameFor(namespace, contextPath)}/${name}');`);
}

function toImportLines(imports, contextPath) {
  return imports.map(({name, namespace, packageName}) => packageName ?
    `import {${name}} from '${packageName}';` :
    `import {${name}} from '${packageNameFor(namespace, contextPath)}/${name}';`);
}

function packageNameFor(namespace, contextPath) {
  const relativePath = path.relative(path.dirname(contextPath), namespace);

  if (relativePath === '') {
    return '.';
  }

  return relativePath.startsWith('.') || relativePath.startsWith('/') ? relativePath : `./${relativePath}`;
}
