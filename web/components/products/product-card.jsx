import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'

export class ProductCard extends Component {
  static propTypes = {
    brand: PropTypes.string,
    description: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    image: PropTypes.string,
  }

  static defaultProps = {
    brand: '',
    description: '',
    id: 0,
    name: '',
    image: null,
  }

  render() {
    const { id, name, brand, description, image } = this.props

    return (
      <div>
        {image ? <img src={image} alt={name} /> : null}
        <Link to={`/product/${id}`}><div className="productName">{name}</div></Link>
        <div className="productBrand">{brand}</div>
        <div className="productDesc">{description}</div>
        <br />
      </div>
    )
  }
}

export default ProductCard
