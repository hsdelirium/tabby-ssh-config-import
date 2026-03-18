const path = require('path')

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'tabbySshConfigImport',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ],
  },
  resolveLoader: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
        },
        exclude: /node_modules[\\/]tabby-ssh-config-import[\\/]node_modules/,
      },
    ],
  },
  externals: [
    /^tabby-/,
    /^@angular\//,
  ],
}
