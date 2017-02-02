import React, { Component, PropTypes } from 'react' // eslint-disable-line import/no-extraneous-dependencies
import ProductList from './product-list'

class ProductCategoryPage extends Component {
  static propTypes = {
    fetchProductsByCategory: PropTypes.func,
    params: PropTypes.shape({
      category: PropTypes.string.isRequired,
    }).isRequired,
  }

  static defaultProps = {
    fetchProductsByCategory: () => [],
  }

  constructor(props) {
    super(props)
    this.state = {
      category: decodeURIComponent(props.params.category),
    }
  }

  componentWillMount() {
    this.props.fetchProductsByCategory(this.state.category)
      .then((products) => {
        console.log(products)
        this.setState({
          productsList: products,
        })
      })
  }

  render() {
    return (
      <div>
        <h4>{this.state.category}</h4>
        <ProductList products={this.state.productsList} />
      </div>
    )
  }
}

export default ProductCategoryPage
