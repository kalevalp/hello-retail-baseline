import React, { Component } from 'react'
import { connect } from 'react-redux'
import { loadCategories } from 'actions'
import CategoryList from 'CategoryList'

class Categories extends Component {
  componentDidMount() {
    const { dispatch } = this.props
    dispatch(loadCategories())
  }
  render() {
    const categories = this.props.categoryList.sort((l, r) => l.name.localeCompare(r.name))

    return (
      <div>
        <h3>Categories</h3>
        <CategoryList className="categoryList" categories={categories} />
      </div>
    )
  }
}

export default connect(state => ({
  categoryList: state.categories,
}))(Categories)
