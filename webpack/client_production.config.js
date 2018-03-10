const path = require('path');
var webpack = require('webpack');
var webpack_common = require('./common');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => ({
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
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: false
    // }) // for now, UglifyJS does not support es6, so we do not minimize code for production
  ]
});
