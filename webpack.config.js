import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default {
  entry: {
    attester: path.resolve('./src/attester.ts'),
    verifier: path.resolve('./src/verifier.ts'),
  },
  output: {
    filename: 'js/[name].js',
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
          to: path.resolve('./dist/'),
        },
      ],
    }),
  ],
};
