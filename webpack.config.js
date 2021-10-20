import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default {
  mode: isDevelopment ? 'development' : 'production',
  entry: {
    App: path.resolve('./src/frontend/App.tsx'),
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
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
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
};
