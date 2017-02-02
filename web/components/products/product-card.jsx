import React, { Component, PropTypes } from 'react' // eslint-disable-line import/no-extraneous-dependencies

class ProductCard extends Component {
  static propTypes = {
    name: PropTypes.string,
    brand: PropTypes.string,
    description: PropTypes.string,
  }

  static defaultProps = {
    name: '',
    brand: '',
    description: '',
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <div>
        <div className="productName">{this.props.name}</div>
        <div className="productBrand">{this.props.brand}</div>
        <div className="productDesc">{this.props.description}</div>
        <br />
      </div>
    )
  }
}

export default ProductCard
