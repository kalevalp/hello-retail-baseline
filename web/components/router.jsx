/* global document */
import React from 'react' // eslint-disable-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom' // eslint-disable-line import/no-extraneous-dependencies
import { Router, Route, IndexRoute, browserHistory } from 'react-router' // eslint-disable-line import/no-extraneous-dependencies
import App from './app'
import CategoryPage from './category/category-page'
import ProductCategoryPage from './products/product-category-page'

ReactDOM.render(
  (<Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={CategoryPage} />
      <Route path="categories" component={CategoryPage} />
      <Route path="products/category/:category" component={ProductCategoryPage} />
    </Route>
  </Router>),
  document.getElementById('root'),
)
