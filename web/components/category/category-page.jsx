import React, { Component, PropTypes } from 'react' // eslint-disable-line import/no-extraneous-dependencies
import CategoryList from './category-list'

// TODO: Further decompose using HOC https://facebook.github.io/react/docs/higher-order-components.html

class CategoryPage extends Component {
  static propTypes = {
    dynamoDb: PropTypes.shape({
      scan: PropTypes.func.isRequired,
    }),
  }

  static defaultProps = {
    dynamoDb: null,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  getCategoriesFromDynamoAsync() {
    const params = {
      TableName: 'demo-ProductCategory-1',
      AttributesToGet: ['category'],
    }

    return new Promise((resolve, reject) => {
      this.props.dynamoDb.scan(params, (err, data) => {
        if (err) { reject(err) }
        resolve(data)
      })
    })
  }

  getCategoriesAsync() {
    return this.getCategoriesFromDynamoAsync()
      .then((data) => {
        const categoriesList = []
        data.Items.forEach((item) => {
          categoriesList.push({
            name: item.category.S,
          })
        })
        return categoriesList
      }, (error) => { throw new Error(error) })
  }

  render() {
    // No data connection available yet.
    if (!this.props.dynamoDb) {
      return (<div>Connecting...</div>)
    }

    // No categories yet.
    if (!this.state.categoryList) {
      this.getCategoriesAsync()
        .then((categories) => {
          console.log(categories)
          this.setState({
            categoryList: categories,
          })
        })

      return (<div>Loading Categories...</div>)
    }

    return (
      <div>
        <h4><em>Categories</em></h4>
        <CategoryList className="categoryList" categories={this.state.categoryList} />
      </div>
    )
  }
}

export default CategoryPage
