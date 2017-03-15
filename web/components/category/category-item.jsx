import React, { Component, PropTypes } from 'react' // eslint-disable-line import/no-extraneous-dependencies
import { Link } from 'react-router' // eslint-disable-line import/no-extraneous-dependencies

class CategoryItem extends Component {
  static propTypes = {
    categoryName: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <div>
        <Link className="categoryLink" to={`/products/category/${encodeURIComponent(this.props.categoryName)}`}>
          {this.props.categoryName}
        </Link>
      </div>
    )
  }
}

export default CategoryItem
