var webpack = require('webpack');
var webpack_common = require('./common');

var options = {
  entry: './client_src/client.tsx',
  target: 'electron-renderer',
  output: {
    filename: './client/client.js'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.ts', '.tsx', '.js'],
    modulesDirectories: ['node_modules']
  },
  module: {
    loaders: [
      {
        test: /\.ts[x]?$/,
        loader: 'ts-loader'
      }
    ]
  },
  plugins: []
};

module.exports = options;
