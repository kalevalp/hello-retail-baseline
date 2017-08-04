import React from 'react'
import { Link } from 'react-router'

const CategoryItem = (props) => {
  const { categoryName } = props
  const uriCategoryName = encodeURIComponent(categoryName)

  return (
    <div>
      <Link className="categoryLink" to={`/category/${uriCategoryName}`}>
        {categoryName}
      </Link>
    </div>
  )
}

export default CategoryItem
