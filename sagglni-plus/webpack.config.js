const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const mode = argv.mode || 'production';
  const isDev = mode === 'development';

  return {
    mode,
    devtool: isDev ? 'eval-source-map' : 'source-map',
    entry: {
      popup: path.resolve(__dirname, 'src/popup/popup.js'),
      background: path.resolve(__dirname, 'src/background/background.js'),
      content: path.resolve(__dirname, 'src/content/content.js'),
      settings: path.resolve(__dirname, 'src/popup/settings.js'),
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'popup.html',
        template: 'src/popup/popup.html',
        chunks: ['popup']
      }),
      new HtmlWebpackPlugin({
        filename: 'settings.html',
        template: 'src/popup/settings.html',
        chunks: ['settings']
      }),
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', to: '.' },
          { from: 'assets', to: 'assets' },
          { from: 'LICENSE', to: '.' },
          { from: 'README.md', to: '.' }
        ]
      })
    ],
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    resolve: {
      extensions: ['.js']
    }
  };
};
