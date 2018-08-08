const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const node_externals = require('webpack-node-externals');
const { VueLoaderPlugin } = require('vue-loader');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const web = {
  entry: {
    index: './src/index.js',
  },
  output: {
    path: __dirname + '/dist/public',
    filename: '[name].js',
    publicPath: './',
  },
  target: "web",
  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['vendor', 'index'],
      template: './src/index.html',
      filename: 'index.html',
    }),
    new VueLoaderPlugin(),
    new ExtractTextPlugin({
      filename: '[name].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader',
            options: {
              // url: false,
              sourceMap: true,
              minimize: true,
            }
          }]
        }),
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.jpe?g$|\.ico$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.wav$|\.mp3$/,
        loader: 'file-loader?name=[name].[ext]'
      }
    ]
  },
  optimization: {
    // minimize: true,
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          name: 'vendor',
          chunks: 'initial',
          enforce: true
        },
      },
    }
  },
  // devtool: false,
};

const server = {
  entry: {
    server: './src/server.js',
  },
  externals: [node_externals()],
  target: "node",
  plugins: [
    new Dotenv(),
  ],
  module: {
    rules: [{
      test: /\.html$/,
      use: [ {
        loader: 'html-loader',
        options: {
          minimize: true,
          removeComments: false,
          collapseWhitespace: false
        }
      }],
    }]
  },
  devtool: false,
};

module.exports = [
  web,
  server
];