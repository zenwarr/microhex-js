var webpack = require('webpack');
var fs = require('fs');
var path = require('path');

/* Compile all test modules */

var base_dir = 'src/test/';
var entries = {};

function process_dir(dir_name) {
  var full_dir_path = path.join(__dirname, '..', dir_name);
  var files = fs.readdirSync(full_dir_path);

  for (var j = 0; j < files.length; ++j) {
    var file_name = files[j];
    var file_path = path.join(__dirname, '..', dir_name, file_name);
    var relpath = path.join(dir_name, file_name);

    if (fs.statSync(file_path).isDirectory()) {
      process_dir(relpath);
    } else {
      var extname = path.extname(relpath);
      if (extname == '.ts' && path.basename(relpath).charAt(0) != '_') {
        var entry_name = relpath.slice(0, -extname.length);
        entries['test/' + entry_name.slice(base_dir.length)] = './' + relpath;
      }
    }
  }
}

process_dir(base_dir);

var webpack_common = require('./common');

module.exports = {
  entry: entries,
  output: {
    path: './build',
    filename: '[name].js',
    libraryTarget: 'commonjs'
  },
  target: 'node',
  externals: [webpack_common.build_externals()],
  node: {
    __dirname: false,
    __filename: false
  },
  resolve: {
    extensions: ['', '.webpack.js', '.ts', '.js']
  },
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  },
  plugins: []
};
