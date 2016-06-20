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
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: false
    // }) // for now, UglifyJS does not support es6, so we do not minimize code for production
  ]
};

module.exports = options;
