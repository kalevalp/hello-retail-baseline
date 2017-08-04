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
    path: `${__dirname}/public/`,
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
    root: __dirname,
    modulesDirectories: [
      'node_modules',
    ],
    extensions: ['', '.js', '.jsx'],
    alias: {
      actions: 'actions/actions.jsx',
      AmazonLogin: 'components/login/amazon-login',
      App: 'components/app.jsx',
      CategoryItem: 'components/categories/category-item',
      CategoryList: 'components/categories/category-list',
      Categories: 'components/categories/categories',
      CreateProduct: 'components/merchant/create-product',
      config: 'config',
      login: 'login/amazon-login',
      Navigation: 'components/navigation/navigation',
      PhotographerRegisterPage: 'components/photographer/photographer-register-page',
      ProductCard: 'components/products/product-card',
      ProductCategory: 'components/products/product-category',
      ProductDetailPage: 'components/products/product-detail-page',
      ProductList: 'components/products/product-list',
      reducers: 'reducers/reducers.jsx',
    },
  },
  devServer: {
    hot: true,
    inline: true,
    port: 7700,
    historyApiFallback: true,
  },
}
