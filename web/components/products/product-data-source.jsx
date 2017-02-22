import { Component, PropTypes } from 'react'
import config from '../../config'

class ProductDataSource extends Component {
  static propTypes = {
    AWS: PropTypes.shape({
      DynamoDB: PropTypes.func,
    }).isRequired,
    category: PropTypes.string,
    productId: PropTypes.string,
    productsLoaded: PropTypes.func.isRequired,
  }

  static defaultProps = {
    category: null,
    productId: null,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.dynamo = new this.props.AWS.DynamoDB()
    this.getProductsByCategoryAsync.bind(this)
    this.getProductsByCategoryFromDynamoAsync.bind(this)
    this.componentDidMount = this.componentDidMount.bind(this)
  }

  componentDidMount() {
    if (this.props.category) {
      this.getProductsByCategoryAsync(this.props.category)
        .then(this.props.productsLoaded)
    } else if (this.props.productId) {
      this.getProductsByIdAsync(this.props.productId)
        .then(this.props.productsLoaded)
    }
  }

  getProductByIdFromDynamoAsync(id) {
    const params = {
      AttributesToGet: [
        'brand',
        'description',
        'name',
        'id',
      ],
      TableName: config.ProductCatalogTableName,
      Key: {
        id: {
          S: id.toString(),
        },
      },
    }

    return new Promise((resolve, reject) => {
      this.dynamo.getItem(params, (err, data) => {
        if (err) { reject(err) }
        resolve(data)
      })
    })
  }

  getProductsByIdAsync(id) {
    return this.getProductByIdFromDynamoAsync(id)
      .then((data) => {
        const productList = []
        productList.push({
          brand: data.Item.brand.S,
          description: data.Item.description.S,
          name: data.Item.name.S,
          id: data.Item.id.S,
        })
        return productList
      }, (error) => { throw new Error(error) })
  }

  getProductsByCategoryFromDynamoAsync(category) {
    const params = {
      ProjectionExpression: 'brand, description, #na, id',
      TableName: config.ProductCatalogTableName,
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
      this.dynamo.query(params, (err, data) => {
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
            id: item.id.S,
          })
        })
        console.log(JSON.stringify(productList))
        return productList
      }, (error) => { throw new Error(error) })
  }

  render() {
    return null
  }
}

export default ProductDataSource
