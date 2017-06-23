const webpack = require('webpack')

module.exports = {
  context: __dirname,
  entry: [
    'script!jquery/dist/jquery.min.js',
    'script!foundation-sites/dist/js/foundation.js',
    './components/router.jsx',
  ],
  externals: {
    jquery: 'jQuery',
  },
  plugins: [
    new webpack.ProvidePlugin({
      '$': 'jquery',  // eslint-disable-line quote-props
      'jQuery': 'jquery', // eslint-disable-line quote-props
    }),
  ],
  output: {
    path: `${__dirname}/app/`,
    filename: 'bundle.js',
    publicPath: 'https://localhost:7700/',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        query:
        {
          presets: ['react', 'es2015', 'stage-0'],
        },
        exclude: [
          /node_modules/,
          /\.spec.jsx?$/,
        ],
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  devServer: {
    hot: true,
    inline: true,
    port: 7700,
    historyApiFallback: true,
  },
}
