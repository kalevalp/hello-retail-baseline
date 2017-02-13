import React, { Component, PropTypes } from 'react' // eslint-disable-line import/no-extraneous-dependencies
import ProductList from './product-list'

// TODO: Further decompose using HOC https://facebook.github.io/react/docs/higher-order-components.html

class ProductCategoryPage extends Component {
  static propTypes = {
    dynamoDb: PropTypes.shape({
      query: PropTypes.func.isRequired,
    }),
    params: PropTypes.shape({
      category: PropTypes.string.isRequired,
    }).isRequired,
  }

  static defaultProps = {
    dynamoDb: null,
  }

  constructor(props) {
    super(props)
    this.state = {
      category: decodeURIComponent(props.params.category),
    }
  }

  getProductsByCategoryFromDynamoAsync(category) {
    const params = {
      ProjectionExpression: 'brand, description, #na',
      TableName: 'demo-ProductCatalog-1',
      IndexName: 'Category',
      KeyConditionExpression: '#ct = :cat',
      ExpressionAttributeNames: {
        '#ct': 'category',
        '#na': 'name',
      },
      ExpressionAttributeValues: {
        ':cat': {
          S: category,
        },
      },
    }

    return new Promise((resolve, reject) => {
      this.props.dynamoDb.query(params, (err, data) => {
        if (err) { reject(err) }
        resolve(data)
      })
    })
  }

  getProductsByCategoryAsync(category) {
    return this.getProductsByCategoryFromDynamoAsync(category)
      .then((data) => {
        const productList = []
        data.Items.forEach((item) => {
          productList.push({
            brand: item.brand.S,
            description: item.description.S,
            name: item.name.S,
          })
        })
        return productList
      }, (error) => { throw new Error(error) })
  }

  render() {
    // No data connection available yet.
    if (!this.props.dynamoDb) {
      return (<div>Connecting...</div>)
    }

    // No list of products yet.
    if (!this.state.productsList) {
      this.getProductsByCategoryAsync(this.state.category)
        .then((products) => {
          console.log(products)
          this.setState({
            productsList: products,
          })
        })

      return (<div>Loading Products...</div>)
    }

    return (
      <div>
        <h4>{this.state.category}</h4>
        <ProductList products={this.state.productsList} />
      </div>
    )
  }
}

export default ProductCategoryPage
