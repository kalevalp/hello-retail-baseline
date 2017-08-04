import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { clearProductsInCategory, loadProductsInCategory } from 'actions'
import ProductList from 'ProductList' // eslint-disable-line import/no-named-as-default


export class ProductCategories extends Component {
  static propTypes = {
    params: PropTypes.shape({
      category: PropTypes.string.isRequired,
    }).isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      category: decodeURIComponent(props.params.category),
    }
  }

  componentDidMount() {
    const { dispatch } = this.props
    dispatch(loadProductsInCategory(this.state.category))
  }

  componentWillUnmount() {
    const { dispatch } = this.props
    dispatch(clearProductsInCategory())
  }

  render() {
    const { category } = this.state
    const productsList = this.props.productsList || []

    return (
      <div>
        <h3>{category}</h3>
        <ProductList products={productsList} category={category} />
      </div>
    )
  }
}

export default connect(state => ({
  productsList: state.products,
}))(ProductCategories)
