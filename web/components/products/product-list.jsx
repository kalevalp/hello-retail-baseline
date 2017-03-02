import React, { Component, PropTypes } from 'react'
import ProductCard from './product-card'

class ProductList extends Component {
  static propTypes = {
    products: PropTypes.arrayOf(PropTypes.object),
    category: PropTypes.string,  // TODO: Remove when product ID is introduced
  }

  static defaultProps = {
    products: [],
    category: '', // TODO: Remove when product ID is introduced
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    if (!this.props.products) {
      return null
    }

    // TODO: Fix using an ID for key of product.
    return (
      <div>{
              /* eslint react/no-array-index-key: "off" */
              this.props.products.map(product => (
                <ProductCard
                  className="productCard"
                  name={product.name}
                  key={product.id}
                  brand={product.brand}
                  description={product.description}
                  id={product.id}
                  image={product.image}
                  category={this.props.category}
                />
              ))
            }</div>
    )
  }
}

export default ProductList
