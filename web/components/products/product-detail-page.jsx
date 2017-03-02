import React, { Component, PropTypes } from 'react'
import ProductDataSource from './product-data-source'

class ProductDetailPage extends Component {
  static propTypes = {
    awsLogin: PropTypes.shape({
      aws: PropTypes.shape({
        DynamoDB: PropTypes.func,
      }),
      getCredentialsForRole: PropTypes.func,
    }),
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  }

  static defaultProps = {
    awsLogin: null,
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
      image: p.image,
    })
  }

  render() {
    // TODO: Add query for single product by id
    return (
      <div>
        <h3>{this.state.brand}</h3>
        <h4>{this.state.name}</h4>
        <div>{this.state.description}</div>
        <div className="productImage">
          <img src={this.state.image} alt="" />
        </div>
        <br />
        <button>Buy</button>
        <ProductDataSource awsLogin={this.props.awsLogin} productId={this.props.params.id} productsLoaded={this.productsLoaded} />
      </div>
    )
  }
}

export default ProductDetailPage
