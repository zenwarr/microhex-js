var webpack = require('webpack');
var webpack_common = require('./common');

var options = {
  entry: './client/client.tsx',
  target: 'electron-renderer',
  output: {
    filename: './build/client/client.js'
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
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: false
    // }) // for now, UglifyJS does not support es6, so we do not minimize code for production
  ]
};

module.exports = options;
