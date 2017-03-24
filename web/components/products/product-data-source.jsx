import { Component, PropTypes } from 'react'
import config from '../../config'

class ProductDataSource extends Component {
  static propTypes = {
    awsLogin: PropTypes.shape({
      aws: PropTypes.shape({
        DynamoDB: PropTypes.func,
      }),
    }),
    category: PropTypes.string,
    productId: PropTypes.string,
    productsLoaded: PropTypes.func.isRequired,
  }

  static defaultProps = {
    awsLogin: null,
    category: null,
    productId: null,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.getProductsByCategoryAsync.bind(this)
    this.getProductsByCategoryFromDynamoAsync.bind(this)
    this.componentDidMount = this.componentDidMount.bind(this)
  }

  componentDidMount() {
    this.dynamo = new this.props.awsLogin.aws.DynamoDB()

    if (this.props.category) {
      return this.getProductsByCategoryAsync(this.props.category)
        .then(this.props.productsLoaded)
    } else if (this.props.productId) {
      return this.getProductsByIdAsync(this.props.productId)
        .then(this.props.productsLoaded)
    } else {
      return Promise.reject(new Error('either category or productId required'))
    }
  }

  getProductByIdFromDynamoAsync(id) {
    const params = {
      AttributesToGet: [
        'brand',
        'description',
        'name',
        'id',
        'image',
      ],
      TableName: config.ProductCatalogTableName,
      Key: {
        id: { S: id.toString() },
      },
    }
    return this.dynamo.getItem(params).promise()
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
          image: data.Item.image ? data.Item.image.S : null,
        })
        return productList
      })
  }

  getProductsByCategoryFromDynamoAsync(category) {
    const params = {
      ProjectionExpression: '#br, #de, #na, id',
      TableName: config.ProductCatalogTableName,
      IndexName: 'Category',
      KeyConditionExpression: '#ct = :ct',
      ExpressionAttributeNames: {
        '#br': 'brand',
        '#de': 'description',
        '#na': 'name',
        '#ct': 'category',
      },
      ExpressionAttributeValues: {
        ':ct': { S: category },
      },
    }
    return this.dynamo.query(params).promise()
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
        return productList
      })
  }

  render() {
    return null
  }
}

export default ProductDataSource
