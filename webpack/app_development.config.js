const path = require('path');
var webpack = require('webpack');
var webpack_common = require('./common');

module.exports = env => ({
  entry: './src/app.ts',
  output: {
    filename: 'app.js',
    path: path.join(__dirname, '../build')
  },
  target: 'electron-main',
  mode: env.prod === true ? 'production' : 'development',
  externals: [webpack_common.build_externals()],
  node: {
    __dirname: false,
    __filename: false
  },
  resolve: {
    extensions: ['.webpack.js', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  },
  plugins: []
});
