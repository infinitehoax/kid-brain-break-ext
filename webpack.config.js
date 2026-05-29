const path   = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',

  entry: {
    background:     './src/background/background.js',
    content:        './src/content/content.js',
    'injected-ui/popup': './src/injected-ui/popup.js',
  },

  output: {
    path:     path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean:    true,
  },

  experiments: {
    outputModule: false,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use:  'babel-loader',
        exclude: /node_modules/,
      }
    ]
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        // Manifest and static HTML/JSON
        { from: 'public/manifest.json',       to: 'manifest.json' },
        { from: 'public/questions.json',       to: 'questions.json' },
        { from: 'public/settings-popup.html',  to: 'settings-popup.html' },
        { from: 'public/settings.js',          to: 'settings.js' },
        { from: 'public/icons',                to: 'icons', noErrorOnMissing: true },
        { from: 'public/assets',               to: 'assets', noErrorOnMissing: true },

        // UI HTML and CSS (not bundled — loaded at runtime via fetch)
        { from: 'src/injected-ui/popup.html',  to: 'injected-ui/popup.html' },
        { from: 'src/injected-ui/popup.css',   to: 'injected-ui/popup.css' },
      ]
    })
  ],

  resolve: {
    extensions: ['.js']
  }
};
