import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import nodeExternals from 'webpack-node-externals';

export default [
  {
    entry: {
      requestAttestation: path.resolve('./src/frontend/requestAttestation.ts'),
      confirmAttestation: path.resolve('./src/frontend/confirmAttestation.ts'),
      verifier: path.resolve('./src/frontend/verifier.ts'),
    },
    output: {
      filename: 'js/[name].js',
      path: path.resolve('./dist/frontend'),
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve('./src/frontend/static/'),
            to: path.resolve('./dist/frontend/'),
          },
        ],
      }),
    ],
  },
  {
    externalsType: 'commonjs',
    externalsPresets: { node: true },
    externals: [nodeExternals()],
    entry: {
      server: path.resolve('./src/backend/server.ts'),
    },
    output: {
      path: path.resolve('./dist/backend'),
      filename: '[name].cjs',
      chunkFormat: 'module',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  },
];
