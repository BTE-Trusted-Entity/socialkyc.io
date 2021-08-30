import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import { createRequire } from 'module';
import nodeExternals from 'webpack-node-externals';

const require = createRequire(import.meta.url);

export default [
  {
    entry: {
      requestAttestation: path.resolve('./src/requestAttestation.ts'),
      confirmAttestation: path.resolve('./src/confirmAttestation.ts'),
      verifier: path.resolve('./src/verifier.ts'),
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
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: ['process'],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve('./src/static/'),
            to: path.resolve('./dist/frontend/'),
          },
        ],
      }),
    ],
  },
  {
    target: 'es6',
    externalsPresets: { node: true },
    externals: [nodeExternals({ importType: 'module' })],
    experiments: {
      outputModule: true,
    },
    entry: {
      server: path.resolve('./src/server.ts'),
    },
    output: {
      path: path.resolve('./dist/backend'),
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
