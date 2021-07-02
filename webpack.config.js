import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';

export default {
  entry: {
    attester: path.resolve('./src/attester.ts'),
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
  plugins: [
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
