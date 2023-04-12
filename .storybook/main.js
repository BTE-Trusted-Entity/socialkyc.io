export default {
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-actions',
    '@storybook/addon-viewport',
    '@storybook/addon-controls',
    '@storybook/addon-toolbars',
  ],
  async webpackFinal(config) {
    const cssRule = config.module.rules.find(
      ({ test }) => test.toString() === '/\\.css$/',
    );

    const cssLoaderOptions = cssRule.use[1].options;
    cssLoaderOptions.modules = {
      namedExport: true,
    };
    return config;
  },
};
