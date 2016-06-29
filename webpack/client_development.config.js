var webpack = require('webpack');
var webpack_common = require('./common');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var options = {
  entry: './src/client/client.tsx',
  target: 'electron-renderer',
  output: {
    path: 'build/client',
    filename: 'client.js'
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
      },
      {
        test: /\.scss$/,
        loaders: ["style", "css", "sass"]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Microhex'
    })
  ]
};

module.exports = options;
