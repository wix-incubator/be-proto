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
      const jsName = `${relativeBasename}.js`;
      const filepath = path.join(outputDir, jsName);

      const fileContents = fileContentsFor(code.js, jsName);

      const promise = fs.outputFile(filepath, fileContents).then(() => output.log(`== Generated ${relativeBasename}`));

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

function fileContentsFor(js, contextPath) {
  const imports = toRequireLines(js.imports, contextPath).join('\r\n');

  return `${imports}

  ${js.code}`;
}

function toRequireLines(jsImports, contextPath) {
  return jsImports.map(({name, namespace, packageName}) => packageName ?
    `const {${name}} = require('${packageName}');` :
    `const ${name} = require('${packageNameFor(namespace, contextPath)}/${name}');`);
}

function packageNameFor(namespace, contextPath) {
  const relativePath = path.relative(path.dirname(contextPath), namespace);

  return relativePath.startsWith('.') || relativePath.startsWith('/') ? relativePath : `./${relativePath}`;
}
