var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: './src/app.js',
  module: {},
  output: {
      path: __dirname + '/dist/',
      filename: 'bundle.js',
      publicPath: '/dist/'
  }, 
  mode: 'development',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000
  },
};