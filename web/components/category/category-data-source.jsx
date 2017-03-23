import { Component, PropTypes } from 'react'
import config from '../../config'

class CategoryDataSource extends Component {
  static propTypes = {
    awsLogin: PropTypes.shape({
      aws: PropTypes.shape({
        DynamoDB: PropTypes.func,
      }),
    }),
    categoriesLoaded: PropTypes.func.isRequired,
  }

  static defaultProps = {
    awsLogin: null,
  }

  constructor(props) {
    super(props)
    this.getCategoriesAsync = this.getCategoriesAsync.bind(this)
    this.getCategoriesFromDynamoAsync = this.getCategoriesFromDynamoAsync.bind(this)
    this.componentDidMount = this.componentDidMount.bind(this)
  }

  componentDidMount() {
    this.dynamo = new this.props.awsLogin.aws.DynamoDB()

    this.getCategoriesAsync()
      .then(this.props.categoriesLoaded)
  }

  getCategoriesFromDynamoAsync() {
    const params = {
      TableName: config.ProductCategoryTableName,
      AttributesToGet: ['category'],
    }
    return this.dynamo.scan(params).promise()
  }

  getCategoriesAsync() {
    return this.getCategoriesFromDynamoAsync()
      .then((data) => { // report successful results
        const categoriesList = []
        data.Items.forEach((item) => {
          categoriesList.push({
            name: item.category.S,
          })
        })
        return categoriesList
      })
  }

  render() {
    return null
  }
}

export default CategoryDataSource
