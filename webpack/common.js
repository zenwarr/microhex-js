var fs = require('fs');

module.exports.build_externals = function() {
  var node_modules = {};
  fs.readdirSync('node_modules').filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  }).forEach(function(mod) {
    node_modules[mod] = mod;
  });

  return node_modules;
}
