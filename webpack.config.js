const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'web/build'),
    filename: 'bundle.[contenthash].js',
    publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ttf$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules\/(?!(react-native-.*|@react-native.*)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['module:@react-native/babel-preset'],
            plugins: ['react-native-web'],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.web.js', '.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'react-native$': 'react-native-web',
      // Add aliases for RN packages that need web versions
      'react-native-svg': 'react-native-svg-web',
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/utils/AsyncStorage.web.js'),
      'react-native-keychain': path.resolve(__dirname, 'src/utils/Keychain.web.js'),
      'react-native-fs': path.resolve(__dirname, 'src/utils/platformHelpers.web.js'),
      'react-native-gesture-handler': path.resolve(__dirname, 'src/utils/GestureHandler.web.js'),
      'react-native-safe-area-context': path.resolve(__dirname, 'src/utils/SafeArea.web.js'),
      'react-native-vector-icons/MaterialIcons$': path.resolve(__dirname, 'src/utils/VectorIcons.web.js'),
      'react-native-vector-icons/MaterialIcons': path.resolve(__dirname, 'src/utils/VectorIcons.web.js'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './web/public/index.html',
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      process: { env: {} },
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'web/public'),
    },
    compress: true,
    port: 3001,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
};