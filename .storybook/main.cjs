const webpack = require('webpack');
const path = require('path');

module.exports = {
  core: {
    builder: 'webpack5',
  },
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-actions/register',
    '@storybook/addon-viewport/register',
    '@storybook/addon-controls/register',
    '@storybook/addon-toolbars/register',
  ],
  typescript: {
    reactDocgen: 'none', // current version doesn’t work with recent TS
  },
  webpackFinal: async (config) => {
    const cssRule = config.module.rules.find(({ test }) => test.toString() === '/\\.css$/');

    // needs to be done while Storybook uses style-loader@2
    const styleLoaderOptions = {
      loader: cssRule.use[0],
      options: { modules: { namedExport: true } }
    };
    cssRule.use[0] = styleLoaderOptions;

    const cssLoaderOptions = cssRule.use[1].options;
    cssLoaderOptions.modules = { namedExport: true };

    return config;
  },
};
