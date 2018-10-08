const path = require('path');
const webpack = require('webpack');

const { CheckerPlugin } = require('awesome-typescript-loader');
const ROOT = path.resolve( __dirname, 'src' );
const DESTINATION = path.resolve( __dirname, 'dist' );

module.exports = {
  context: ROOT,
  entry: {
    'main': './index.ts'
  },
  output: {
    filename: '[name].bundle.js',
    path: DESTINATION
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [
        ROOT,
        'node_modules'
    ]
  },

  devtool: 'source-map',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'tslint-loader'
      },
      {
        test: /\.ts$/,
        exclude: [ /node_modules/ ],
        use: 'awesome-typescript-loader'
      }
    ]
  },
  plugins: [
      new CheckerPlugin()
  ]
};