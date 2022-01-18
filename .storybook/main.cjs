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

    workaroundRequireNotDefined(config);

    return config;
  },
};

/** Workaround for https://github.com/storybookjs/storybook/issues/14877 */
function workaroundRequireNotDefined(config) {
  function replaceFileExtension(filePath, newExtension) {
    const { name, root, dir } = path.parse(filePath);
    return path.format({
      name,
      root,
      dir,
      ext: newExtension,
    });
  }

  // Find the plugin instance that needs to be mutated
  const virtualModulesPlugin = config.plugins.find(
    (plugin) => plugin.constructor.name === "VirtualModulesPlugin"
  );

  // Change the file extension to .cjs for all files that end with "generated-stories-entry.js"
  virtualModulesPlugin._staticModules = Object.fromEntries(
    Object.entries(virtualModulesPlugin._staticModules).map(
      ([key, value]) => {
        if (key.endsWith("generated-stories-entry.js")) {
          return [replaceFileExtension(key, ".cjs"), value];
        }
        return [key, value];
      }
    )
  );

  // Change the entry points to point to the appropriate .cjs files
  config.entry = config.entry.map((entry) => {
    if (entry.endsWith("generated-stories-entry.js")) {
      return replaceFileExtension(entry, ".cjs");
    }
    return entry;
  });
}
