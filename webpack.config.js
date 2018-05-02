// webpack.config.js
// const webpack = require('webpack');
const path = require('path');

const config = {
  context: path.resolve(__dirname, 'src/frontend/src'),
  entry: './app.js',
  output: {
    path: path.resolve(__dirname, 'src/frontend/www'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src/frontend/src'),
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              'react',
              ['es2015', {modules: false}],
            ],
          },
        }],
      },
    ],
  },
};

module.exports = config;
