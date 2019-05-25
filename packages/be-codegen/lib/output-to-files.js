const fs = require('fs-extra');
const path = require('path');

module.exports = function outputToFiles(outputDir, output = console) {

  let fulfillCallback;

  const pendingPromises = [];
  const completePromise = new Promise((fulfill) => {
    fulfillCallback = fulfill;
  })

  return {
    add(code) {
      const relativeBasename = code.namespace ? `${code.namespace}/${code.name}` : `${code.name}`;
      const jsName = `${relativeBasename}.js`;
      const filepath = path.join(outputDir, jsName);

      const promise = fs.outputFile(filepath, code.js.code).then(() => output.log(`== Generated ${relativeBasename}`));

      pendingPromises.push(promise);
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
