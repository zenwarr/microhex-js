var webpack = require('webpack');
var webpackTargetElectronRenderer = require('webpack-target-electron-renderer');
var webpack_common = require('./common');

var options = {
  entry: './client_src/js/client.ts',
  output: {
    filename: './client/js/client.js'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.ts', '.js'],
    modulesDirectories: ['node_modules']
  },
  externals: [webpack_common.build_externals()],
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

options.target = webpackTargetElectronRenderer(options);

module.exports = options;
