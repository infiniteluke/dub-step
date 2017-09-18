const path = require('path');

module.exports = {
  entry: './src/dub-step.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'dub-step.js',
    libraryTarget: 'commonjs2', // THIS IS THE MOST IMPORTANT LINE! :mindblow: I wasted more than 2 days until realize this was the line most important in all this guide.
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|dist)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['react-app'],
          },
        },
      },
    ],
  },
  externals: {
    react: 'commonjs react',
  },
};
