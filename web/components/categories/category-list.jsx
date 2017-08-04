import React from 'react'
import { connect } from 'react-redux'
import CategoryItem from 'CategoryItem'

export const CategoryList = (props) => {
  const { categories } = props

  return (
    <div>
      {
        categories.map(cat => (
          <CategoryItem className="categoryItem" categoryName={cat.name} key={cat.name} />
        ))
      }
    </div>
  )
}

export default connect(state => ({
  categories: state.categories,
}))(CategoryList)
