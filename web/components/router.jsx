/* global document window */
import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRoute, hashHistory } from 'react-router'
import { Provider } from 'react-redux'
import * as redux from 'redux'
import thunk from 'redux-thunk'

import App from 'App'
import Categories from 'Categories'
import CreateProduct from 'CreateProduct'
import PhotographerRegisterPage from 'PhotographerRegisterPage'
import ProductCategory from 'ProductCategory'
import ProductDetailPage from 'ProductDetailPage'
import helloRetailReducers from 'reducers'

// Load Foundation
require('style!css!foundation-sites/dist/css/foundation.min.css') // eslint-disable-line import/no-webpack-loader-syntax, import/no-unresolved

$(document).foundation() // eslint-disable-line no-undef

const store = redux.createStore(helloRetailReducers, {}, redux.compose(
  redux.applyMiddleware(thunk),
  window.devToolsExtension ? window.devToolsExtension() : x => x,
))

ReactDOM.render(
  (<Provider store={store}>
    <Router history={hashHistory}>
      <Route path="/" component={App}>
        <IndexRoute component={Categories} />
        <Route path="category/:category" component={ProductCategory} />

        <Route path="merchant" component={CreateProduct} />
        <Route path="photographer" component={PhotographerRegisterPage} />
        <Route path="product/:id" component={ProductDetailPage} />
      </Route>
    </Router>
  </Provider>),
  document.getElementById('root'),
)
