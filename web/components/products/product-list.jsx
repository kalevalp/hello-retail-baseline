import React, { Component, PropTypes } from 'react' // eslint-disable-line import/no-extraneous-dependencies
import ProductCard from './product-card'

class ProductList extends Component {
  static propTypes = {
    products: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    products: [],
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    if (!this.props.products) {
      return (<div />)
    }

    return (
      <div>{
              this.props.products.map(product => (
                <ProductCard
                  className="productCard"
                  name={product.name}
                  brand={product.brand}
                  description={product.description}
                />
              ))
            }</div>
    )
  }
}

export default ProductList
