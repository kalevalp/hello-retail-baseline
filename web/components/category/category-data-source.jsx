import { Component, PropTypes } from 'react'
import config from '../../config'

class CategoryDataSource extends Component {
  static propTypes = {
    AWS: PropTypes.shape({
      DynamoDB: PropTypes.func,
    }).isRequired,
    categoriesLoaded: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.dynamo = new this.props.AWS.DynamoDB()
    this.getCategoriesAsync = this.getCategoriesAsync.bind(this)
    this.getCategoriesFromDynamoAsync = this.getCategoriesFromDynamoAsync.bind(this)
    this.componentDidMount = this.componentDidMount.bind(this)
  }

  componentDidMount() {
    this.getCategoriesAsync()
      .then(this.props.categoriesLoaded)
  }

  getCategoriesFromDynamoAsync() {
    const params = {
      TableName: config.ProductCategoryTableName,
      AttributesToGet: ['category'],
    }

    return new Promise((resolve, reject) => {
      this.dynamo.scan(params, (err, data) => {
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
    return null
  }
}

export default CategoryDataSource
