var webpack = require('webpack');
var webpack_common = require('./common');

module.exports = {
  entry: './src/app.ts',
  output: {
    filename: './build/app.js'
  },
  target: 'electron',
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
