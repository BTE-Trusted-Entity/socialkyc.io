export default process.env.npm_lifecycle_event !== 'storybook' ? {} : {
  sourceType: 'unambiguous',
  presets: [
    ['@babel/preset-env', { targets: { chrome: 100, firefox: 100 } }],
    '@babel/preset-typescript',
  ],
};
