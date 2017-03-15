/* global amazon window */
import AWS from 'aws-sdk'  // eslint-disable-line import/no-extraneous-dependencies
import React, { Component } from 'react' // eslint-disable-line import/no-extraneous-dependencies
import loadjs from 'loadjs' // eslint-disable-line import/no-extraneous-dependencies

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loggedIn: false,
    }
  }

  componentWillMount() {
    const app = this

    function getCategoriesFromDynamo(dynamodb) {
      const params = {
        TableName: 'demo-ProductCategory-1',
        AttributesToGet: ['category'],
      }

      return new Promise((resolve, reject) => {
        dynamodb.scan(params, (err, data) => {
          if (err) { reject(err) }
          resolve(data)
        })
      })
    }

    function getProductsByCategoryFromDynamo(dynamodb, category) {
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
        dynamodb.query(params, (err, data) => {
          if (err) { reject(err) }
          resolve(data)
        })
      })
    }

    function authAmazonLogin() {
      return new Promise((resolve, reject) => {
        amazon.Login.setClientId('amzn1.application-oa2-client.d38cc5e49f9343b5b7a718f9d21fc93a')
        const options = { scope: 'profile' }
        amazon.Login.authorize(options, (response) => {
          if (response.error) { reject(response.error) }
          resolve(response)
        })
      })
    }

    function assumeWebAppIdentityWithToekn(sts, token) {
      const params = {
        DurationSeconds: 3600,
        ProviderId: 'www.amazon.com',
        RoleArn: 'arn:aws:iam::515126931066:role/demoHelloRetailWebIdentity',
        RoleSessionName: 'HelloRetailDemo',
        WebIdentityToken: token,
      }

      return new Promise((resolve, reject) => {
        sts.assumeRoleWithWebIdentity(params, (err, data) => {
          if (err) { reject(err) }
          resolve(data)
        })
      })
    }

    function assumeProductCatalogReaderRole(sts, creds) {
      const params = {
        RoleArn: 'arn:aws:iam::515126931066:role/demoProductCatalogReader',
        RoleSessionName: 'HelloRetailDemo',
      }

      sts.config.credentials = {  // eslint-disable-line no-param-reassign
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken,
      }

      return new Promise((resolve, reject) => {
        sts.assumeRole(params, (err, data) => {
          if (err) { reject(err) }
          resolve(data)
        })
      })
    }

    window.onAmazonLoginReady = () => {
      const sts = new AWS.STS()

      authAmazonLogin()
        .then(loginResponse => assumeWebAppIdentityWithToekn(sts, loginResponse.access_token))
        .then(identity => assumeProductCatalogReaderRole(sts, identity.Credentials))
        .then((role) => {
          AWS.config.credentials = {
            accessKeyId: role.Credentials.AccessKeyId,
            secretAccessKey: role.Credentials.SecretAccessKey,
            sessionToken: role.Credentials.SessionToken,
          }
          AWS.config.region = 'us-west-2'

          const dynamodb = new AWS.DynamoDB()

          app.fetchCategories = () => { // eslint-disable-line arrow-body-style
            return getCategoriesFromDynamo(dynamodb)
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

          app.fetchProductsByCategory = (category) => { // eslint-disable-line arrow-body-style
            return getProductsByCategoryFromDynamo(dynamodb, category)
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

          app.setState({
            loggedIn: true,
            fetchCategories: app.fetchCategories,
            fetchProductsByCategory: app.fetchProductsByCategory,
          })
        })
    }

    loadjs('https://api-cdn.amazon.com/sdk/login1.js')
  }

  render() {
    const app = this
    let children = null

    if (!this.state.loggedIn) {
      children = (<div>Logging in...</div>)
    } else {
      children = React.Children.map(this.props.children, child => React.cloneElement(child, { // eslint-disable-line react/prop-types
        fetchCategories: app.state.fetchCategories,
        fetchProductsByCategory: app.state.fetchProductsByCategory,
      }))
    }

    return (
      <div className="app text-center container" >
        <h2>Hello Retail</h2>
        <div className="content">
          {children}
        </div>
      </div>
    )
  }
}

export default App
