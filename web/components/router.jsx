/* global document */
import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRoute, hashHistory } from 'react-router'

import App from './app'
import CategoryPage from './category/category-page'
import NewProductPage from './merchant/new-product-page'
import PhotographerRegisterPage from './photographer/photographer-register-page'
import ProductCategoryPage from './products/product-by-category-page'
import ProductDetailPage from './products/product-detail-page'
import RoleSelectionPage from './roles/role-selection-page'

// Load Foundation
require('style!css!foundation-sites/dist/css/foundation.min.css') // eslint-disable-line import/no-webpack-loader-syntax, import/no-unresolved

$(document).foundation() // eslint-disable-line no-undef

ReactDOM.render(
  (<Router history={hashHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={RoleSelectionPage} />

      <Route path="categories" component={CategoryPage} />
      <Route path="merchant" component={NewProductPage} />
      <Route path="photographer" component={PhotographerRegisterPage} />
      <Route path="category/:category" component={ProductCategoryPage} />
      <Route path="product/:id" component={ProductDetailPage} />
    </Route>
  </Router>),
  document.getElementById('root'),
)
