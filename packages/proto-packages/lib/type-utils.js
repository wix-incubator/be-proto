module.exports = {
  resolveNamespace
};

function resolveNamespace(node) {
  const namespace = collectNamespace(node);

  return namespace.length === 0 ? undefined : namespace.join('.');
}

function collectNamespace(node, namespace = []) {
  const parent = node.parent;

  if (parent) {
    if (parent.name > '') {
      namespace.unshift(parent.name);
    }

    collectNamespace(parent, namespace);
  }

  return namespace;
}
