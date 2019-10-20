module.exports = {
  resolveNamespace,
  resolveFullyQualifiedName
};

function resolveFullyQualifiedName(node) {
  const namespace = resolveNamespace(node);

  return namespace ? `${namespace}.${node.name}` : node.name;
}

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
