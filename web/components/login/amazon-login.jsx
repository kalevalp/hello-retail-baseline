/* global amazon window */
import AWS from 'aws-sdk'
import React, { Component, PropTypes } from 'react'
import loadjs from 'loadjs'
import config from '../../config'

class AmazonLogin extends Component {
  static propTypes = {
    awsLogin: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)

    this.loginConfig = {
      // TODO: Sign requests like: https://github.com/Nordstrom/artillery-plugin-aws-sigv4/blob/master/lib/aws-sigv4.js
      catalogReaderRole: config.CatalogReaderRole,
      clientId: config.AuthClientId,
      awsRegion: config.AWSRegion,
      sessionName: config.SessionName,
      webAppRole: config.WebAppRole,
    }

    console.log(this.loginConfig)

    // Amazon auth options passed to authorize()
    this.authOptions = {
      scope: 'profile',
    }

    this.assumeWebAppIdentityWithToken = this.assumeWebAppIdentityWithToken.bind(this)
    this.authAmazonLogin = this.authAmazonLogin.bind(this)
    this.assumeProductCatalogReaderRole = this.assumeProductCatalogReaderRole.bind(this)
    this.componentWillMount = this.componentWillMount.bind(this)
    this.loginClicked = this.loginClicked.bind(this)

    this.state = {
      amazonLoginReady: false,
    }
  }

  componentWillMount() {
    const awsLogin = this
    window.onAmazonLoginReady = () => {
      awsLogin.setState({
        amazonLoginReady: true,
      })
    }

    loadjs('https://api-cdn.amazon.com/sdk/login1.js')
  }

  loginClicked() {
    this.sts = new AWS.STS()

    this.authAmazonLogin()
      .then(loginResponse => this.assumeWebAppIdentityWithToken(loginResponse.access_token))
      .then(identity => this.assumeProductCatalogReaderRole(identity.Credentials))
      .then((role) => {
        AWS.config.credentials = {
          accessKeyId: role.Credentials.AccessKeyId,
          secretAccessKey: role.Credentials.SecretAccessKey,
          sessionToken: role.Credentials.SessionToken,
        }

        AWS.config.region = this.loginConfig.awsRegion

        this.props.awsLogin(AWS)
      })
  }

  assumeWebAppIdentityWithToken(token) {
    const awsLogin = this

    const params = {
      DurationSeconds: 3600,
      ProviderId: 'www.amazon.com',
      RoleArn: this.loginConfig.webAppRole,
      RoleSessionName: this.loginConfig.sessionName,
      WebIdentityToken: token,
    }

    console.log(params)


    return new Promise((resolve, reject) => {
      awsLogin.sts.assumeRoleWithWebIdentity(params, (err, data) => {
        if (err) { reject(err) }
        resolve(data)
      })
    })
  }

  authAmazonLogin() {
    const awsLogin = this

    // TODO: Request user identity

    return new Promise((resolve, reject) => {
      window.amazon.Login.setClientId(awsLogin.loginConfig.clientId)
      window.amazon.Login.authorize(awsLogin.authOptions, (response) => {
        if (response.error) { reject(response.error) }
        console.log(response)
        resolve(response)
      })
    })
  }

  assumeProductCatalogReaderRole(creds) {
    const awsLogin = this

    const params = {
      RoleArn: this.loginConfig.catalogReaderRole,
      RoleSessionName: this.loginConfig.sessionName,
    }

    awsLogin.sts.config.credentials = {  // eslint-disable-line no-param-reassign
      accessKeyId: creds.AccessKeyId,
      secretAccessKey: creds.SecretAccessKey,
      sessionToken: creds.SessionToken,
    }

    return new Promise((resolve, reject) => {
      awsLogin.sts.assumeRole(params, (err, data) => {
        if (err) { reject(err) }
        resolve(data)
      })
    })
  }

  render() {
    return (
      <div id="amazon-root">
        <button onClick={this.loginClicked} disabled={!this.state.amazonLoginReady}>Amazon Login</button>
      </div>
    )
  }
}

export default AmazonLogin
