
module.exports = function reference(id, source, refs) {
  refs[id] = {
    id,
    source
  };

  if (id.indexOf('.') >= 0) {
    refs[id].name = id.substr(id.lastIndexOf('.') + 1);
  }

  return refs[id].name || refs[id].id;
};
