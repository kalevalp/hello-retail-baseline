import React, { Component, PropTypes } from 'react' // eslint-disable-line import/no-extraneous-dependencies
import CategoryList from './category-list'

class CategoryPage extends Component {
  static propTypes = {
    fetchCategories: PropTypes.func,
  }

  static defaultProps = {
    fetchCategories: () => [],
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    this.props.fetchCategories()
      .then((categories) => {
        console.log(categories)
        this.setState({
          categoryList: categories,
        })
      })
  }

  render() {
    return (
      <div>
        <h4><em>Categories</em></h4>
        <CategoryList className="categoryList" categories={this.state.categoryList} />
      </div>
    )
  }
}

export default CategoryPage
