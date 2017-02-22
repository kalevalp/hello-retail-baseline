import React, { Component, PropTypes } from 'react'
import ProductDataSource from './product-data-source'

class ProductDetailPage extends Component {
  static propTypes = {
    AWS: PropTypes.shape({
      DynamoDB: PropTypes.func,
    }),
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  }

  static defaultProps = {
    AWS: null,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.productsLoaded = this.productsLoaded.bind(this)
  }

  productsLoaded(products) {
    const p = products[0]
    this.setState({
      name: p.name,
      brand: p.brand,
      description: p.description,
      id: p.id,
    })
  }

  render() {
    // TODO: Add query for single product by id
    // TODO: Add image
    return (
      <div>
        <h3>{this.state.brand}</h3>
        <h4>{this.state.name}</h4>
        <div>{this.state.description}</div>
        <br />
        <button>Buy</button>
        <ProductDataSource AWS={this.props.AWS} productId={this.props.params.id} productsLoaded={this.productsLoaded} />
      </div>
    )
  }
}

export default ProductDetailPage
