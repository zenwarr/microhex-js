var fs = require('fs');
var path = require('path');
var nodeunit = require('nodeunit');

var dirs = [];
var files = fs.readdirSync(__dirname);

for (var j = 0; j < files.length; ++j) {
  var file = files[j];

  var file_path = path.join(__dirname, file);
  if (fs.statSync(file_path).isDirectory()) {
    dirs.push(file_path);
  }
}

nodeunit.reporters.default.run(dirs);
