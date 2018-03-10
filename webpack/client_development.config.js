const path = require('path');
var webpack = require('webpack');
var webpack_common = require('./common');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var options = env => ({
  entry: './src/client/client.tsx',
  target: 'electron-renderer',
  mode: env.prod === true ? 'production' : 'development',
  output: {
    filename: 'client.js',
    path: path.join(__dirname, '../build')
  },
  resolve: {
    extensions: ['.webpack.js', '.ts', '.tsx', '.js']
  },
  module: {
    rules: [
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
});

module.exports = options;
