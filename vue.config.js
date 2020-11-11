const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  css: {
    extract: false
  },
  filenameHashing: false,
  // disable sourcemaps for Figma
  productionSourceMap: false,
  chainWebpack: config => {
    // Disable default index.html generation
    // https://github.com/vuejs/vue-cli/issues/1478
    config.plugins.delete('html');
    config.plugins.delete('preload');
    config.plugins.delete('prefetch');
    config.optimization.delete('splitChunks');
    config.entryPoints.delete('app');
    // Encode svg assets as base64 for Figma since
    // resources have to be embedded:
    // https://www.figma.com/plugin-docs/resource-links/
    const svgRule = config.module.rule('svg');
    svgRule.uses.clear();
    config.module
      .rule('svg')
      .test(/\.(png|jpg|gif|webp|svg)$/)
      .use('url-loader')
      .loader('url-loader');
  },
  configureWebpack: {
    plugins: [
      new HtmlWebpackPlugin({
        template: './ui/index.html',
        filename: 'index.html',
        inlineSource: '.(js)$',
        chunks: ['ui']
      }),
      new HtmlWebpackInlineSourcePlugin()
    ],
    entry: {
      ui: ['./ui/main.ts'],
      code: ['./plugin/index.ts']
    },
    resolve: {
      alias: {
        '@': path.resolve('./ui')
      }
    },
    output: {
      filename: '[name].js',
      chunkFilename: '[name].js'
    }
  }
};
