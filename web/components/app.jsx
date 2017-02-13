/* global amazon window */
import AmazonLogin from '../login/amazon-login'
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

  dynamoDbReady(dynamo) {

  }

  componentWillMount() {
    const app = this

  //   function authAmazonLogin() {
  //     return new Promise((resolve, reject) => {
  //       amazon.Login.setClientId(this.state.clientId)
  //       const options = { scope: 'profile' }
  //       amazon.Login.authorize(options, (response) => {
  //         if (response.error) { reject(response.error) }
  //         resolve(response)
  //       })
  //     })
  //   }
  //
  //   function assumeWebAppIdentityWithToekn(sts, token) {
  //     const params = {
  //       DurationSeconds: 3600,
  //       ProviderId: 'www.amazon.com',
  //       RoleArn: 'arn:aws:iam::515126931066:role/demoHelloRetailWebIdentity',
  //       RoleSessionName: 'HelloRetailDemo',
  //       WebIdentityToken: token,
  //     }
  //
  //     return new Promise((resolve, reject) => {
  //       sts.assumeRoleWithWebIdentity(params, (err, data) => {
  //         if (err) { reject(err) }
  //         resolve(data)
  //       })
  //     })
  //   }
  //
  //   function assumeProductCatalogReaderRole(sts, creds) {
  //     const params = {
  //       RoleArn: 'arn:aws:iam::515126931066:role/demoProductCatalogReader',
  //       RoleSessionName: 'HelloRetailDemo',
  //     }
  //
  //     {/*sts.config.credentials = {  // eslint-disable-line no-param-reassign*/}
  //       {/*accessKeyId: creds.AccessKeyId,*/}
  //       {/*secretAccessKey: creds.SecretAccessKey,*/}
  //       {/*sessionToken: creds.SessionToken,*/}
  //     {/*}*/}

  //     return new Promise((resolve, reject) => {
  //       sts.assumeRole(params, (err, data) => {
  //         if (err) { reject(err) }
  //         resolve(data)
  //       })
  //     })
  //   }
  //
  //   window.onAmazonLoginReady = () => {
  //     const sts = new AWS.STS()
  //
  //     authAmazonLogin()
  //       .then(loginResponse => assumeWebAppIdentityWithToekn(sts, loginResponse.access_token))
  //       .then(identity => assumeProductCatalogReaderRole(sts, identity.Credentials))
  //       .then((role) => {
  //         AWS.config.credentials = {
  //           accessKeyId: role.Credentials.AccessKeyId,
  //           secretAccessKey: role.Credentials.SecretAccessKey,
  //           sessionToken: role.Credentials.SessionToken,
  //         }
  //
  //         AWS.config.region = 'us-west-2'
  //
  //         const dynamodb = new AWS.DynamoDB()
  //
  //         app.setState({
  //           loggedIn: true,
  //           dynamoDb: dynamodb,
  //         })
  //       })
  //   }
  //
  //   loadjs('https://api-cdn.amazon.com/sdk/login1.js')
  }

  render() {
    const app = this
    let children = null

    if (!this.state.loggedIn) {
      children = (<AmazonLogin clientId={}/>)
    } else {
      // Maps properties to child components dynamically, allowing those properties to be bound once available.
      children = React.Children.map(this.props.children, child => React.cloneElement(child, { // eslint-disable-line react/prop-types
        dynamoDb: app.state.dynamoDb,
        // fetchProductsByCategory: app.state.fetchProductsByCategory,
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
