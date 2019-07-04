const {typeUtils} = require('@wix/proto-packages');

module.exports = function codeReferences(localTypes = []) {
  const jsRefs = {};
  const tsRefs = {};

  const localTypesFqn = localTypes.map((type) => typeUtils.resolveFullyQualifiedName(type));

  return {
    jsReference(id, source = null) {
      return ifNotLocal(id, source, () => reference(id, source, jsRefs), id);
    },
    tsReference(id, source = null) {
      return ifNotLocal(id, source, () => fqnReference(id, source, tsRefs), id);
    },
    get jsRefs() {
      return jsRefs;
    },
    get tsRefs() {
      return tsRefs;
    }
  };

  function ifNotLocal(id, source, fn, fallback) {
    if (source) {
      const refType = source.lookup(id);

      if (refType) {
        const fqn = typeUtils.resolveFullyQualifiedName(refType);

        if (localTypesFqn.indexOf(fqn) >= 0) {
          return fallback;
        }
      }
    }

    return fn();
  }
}

function reference(id, source, refs) {
  refs[id] = {
    id,
    source
  };

  if (id.indexOf('.') >= 0) {
    refs[id].name = id.substr(id.lastIndexOf('.') + 1);
  } else {
    refs[id].name = id;
  }

  return refs[id].name || refs[id].id;
};

function fqnReference(id, source, refs) {
  refs[id] = {
    id,
    name: id,
    source
  };

  return id;
}
