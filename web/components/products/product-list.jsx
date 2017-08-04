import React, { Component, PropTypes } from 'react'
import ProductCard from 'ProductCard'

export class ProductList extends Component {
  static propTypes = {
    products: PropTypes.arrayOf(PropTypes.object).isRequired,
    category: PropTypes.string.isRequired,
  }

  render() {
    if (!this.props.products) {
      return null
    }

    return (
      <div>
        <div>{
          this.props.products.map(product => (
            <ProductCard
              className="productCard"
              category={this.props.category}
              {...product}
            />
          ))
        }</div>
      </div>
    )
  }
}

export default ProductList
