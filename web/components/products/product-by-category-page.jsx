import React, { Component, PropTypes } from 'react'
import ProductList from './product-list'
import ProductDataSource from './product-data-source'

// TODO: Further decompose using HOC https://facebook.github.io/react/docs/higher-order-components.html

class ProductCategoryPage extends Component {
  static propTypes = {
    AWS: PropTypes.shape({
      DynamoDB: PropTypes.func,
    }),
    params: PropTypes.shape({
      category: PropTypes.string.isRequired,
    }).isRequired,
  }

  static defaultProps = {
    AWS: null,
  }

  constructor(props) {
    super(props)
    this.state = {
      category: decodeURIComponent(props.params.category),
    }
    this.productsLoaded = this.productsLoaded.bind(this)
  }

  productsLoaded(products) {
    this.setState({
      productsList: products,
    })
  }

  render() {
    return (
      <div>
        <h4>{this.state.category}</h4>
        <ProductList products={this.state.productsList} category={this.state.category} />
        <ProductDataSource AWS={this.props.AWS} category={this.state.category} productsLoaded={this.productsLoaded} />
      </div>
    )
  }
}

export default ProductCategoryPage
