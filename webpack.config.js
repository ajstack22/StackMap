const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { GenerateSW } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  // Re-enable cache with proper invalidation
  cache: {
    type: 'filesystem',
    buildDependencies: { 
      config: [__filename] 
    },
    version: 'v2-sync-fix-deployed'  // Bump this for cache invalidation
  },
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
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext',
              target: 'es5',
              jsx: 'react',
              allowJs: true,
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
            },
          },
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules\/(?!(react-native.*|@react-native.*)\/).*/,
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
      // CRITICAL: Override react-native with our complete replacement
      // This catches ALL imports from 'react-native'
      'react-native$': path.resolve(__dirname, 'react-native.web.js'),
      'react-native': path.resolve(__dirname, 'react-native.web.js'),
      'react-native/Libraries/Utilities/Dimensions': path.resolve(__dirname, 'src/utils/react-native-web-modules/Dimensions.js'),
      'react-native/Libraries/Utilities/Platform': path.resolve(__dirname, 'src/utils/react-native-web-modules/Platform.js'),
      // Add more specific paths to catch internal imports
      'react-native/Libraries/ReactNative/UIManager': path.resolve(__dirname, 'src/utils/react-native-web-modules/UIManager.js'),
      'react-native/src/private/specs_DEPRECATED/modules/NativeUIManager': path.resolve(__dirname, 'src/utils/react-native-web-modules/UIManager.js'),
      'react-native/Libraries/TurboModule/TurboModuleRegistry': path.resolve(__dirname, 'src/utils/react-native-web-modules/TurboModuleRegistry.js'),
      // Mock codegen and native component paths for pager-view
      'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'src/utils/react-native-web-modules/mocks.js'),
      'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, 'src/utils/react-native-web-modules/mocks.js'),
      'react-native/Libraries/NativeComponent/NativeComponentRegistry': path.resolve(__dirname, 'src/utils/react-native-web-modules/mocks.js'),
      'react-native/Libraries/NativeComponent/ViewConfigIgnore': path.resolve(__dirname, 'src/utils/react-native-web-modules/mocks.js'),
      'react-native/Libraries/ReactNative/RendererProxy': path.resolve(__dirname, 'src/utils/react-native-web-modules/mocks.js'),
      
      // Add aliases for RN packages that need web versions
      'react-native-pager-view': path.resolve(__dirname, 'src/utils/PagerView.web.js'),
      'react-native-svg': 'react-native-svg-web',
      'react-native-qrcode-svg': path.resolve(__dirname, 'src/utils/QRCode.web.js'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/utils/AsyncStorage.web.js'),
      '@react-native-community/netinfo': path.resolve(__dirname, 'src/utils/NetInfo.web.js'),
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
      publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      process: { env: {} },
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'web/public/manifest.json', to: 'manifest.json' },
        { from: 'web/public/icons', to: 'icons' },
      ],
    }),
    // Add service worker generation for production builds
    ...(process.env.NODE_ENV === 'production' ? [
      new GenerateSW({
        // Don't claim clients immediately - let user control when to update
        clientsClaim: false,
        // Don't skip waiting - activate on next navigation
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        exclude: [/\.map$/, /^manifest.*\.js$/],
        runtimeCaching: [
          {
            // Only cache requests to the same origin and path, but exclude API calls
            urlPattern: ({ url }) => {
              return url.origin === self.location.origin && 
                     url.pathname.startsWith(self.location.pathname.replace(/\/[^/]*$/, '/')) &&
                     !url.pathname.includes('/api/');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'stackmap-data',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(js|css|woff2?)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'stackmap-assets',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'stackmap-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      }),
    ] : []),
  ],
  optimization: isProduction ? {
    minimizer: [
      '...',  // Keep default minimizers
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,  // Keep console.log for debugging
          },
        },
      }),
    ],
  } : {},
  devServer: {
    static: {
      directory: path.join(__dirname, 'web/public'),
    },
    compress: true,
    port: 5503,
    hot: true,
    open: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api/sync'],
        target: 'https://stackmap.app',
        changeOrigin: true,
        secure: true,
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
          console.log('[Proxy] Forwarding:', req.url, '->', 'https://stackmap.app' + req.url);
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log('[Proxy] Response:', proxyRes.statusCode);
        }
      }
    ]
  },
};