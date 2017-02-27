/* global amazon window */
import AWS from 'aws-sdk'
import https from 'https'
import loadjs from 'loadjs'
import React, { Component, PropTypes } from 'react'
import config from '../../config'

class AmazonLogin extends Component {
  static propTypes = {
    awsLoginComplete: PropTypes.func.isRequired,
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
    this.retrieveProfile = this.retrieveProfile.bind(this)
    this.sendUserLogin = this.sendUserLogin.bind(this)

    this.state = {
      amazonLoginReady: false,
    }
  }

  componentWillMount() {
    const that = this
    window.onAmazonLoginReady = () => {
      that.setState({
        amazonLoginReady: true,
      })
    }

    loadjs('https://api-cdn.amazon.com/sdk/login1.js')
  }

  getCredentialsForRole(roleArn) {
    const that = this

    const params = {
      RoleArn: roleArn,
      RoleSessionName: this.loginConfig.sessionName,
    }

    // TODO: don't rely on current webApp creds to be unexpired -- alter assumeWebAppIdentityWithToken to cache and update if needed
    // TODO: implement caching for all role credentials

    that.sts.config.credentials = that.webApplicationIdentityCredentials

    return new Promise((resolve, reject) => {
      that.sts.assumeRole(params, (err, data) => {
        if (err) {
          reject(`Failed to assume role ${roleArn}: ${err}`)
        } else {
          resolve({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken,
          })
        }
      })
    })
  }

  authAmazonLogin() {
    const that = this

    return new Promise((resolve, reject) => {
      window.amazon.Login.setClientId(that.loginConfig.clientId)
      window.amazon.Login.authorize(that.authOptions, (response) => {
        if (response.error) { reject(response.error) }
        console.log(response)
        resolve(response)
      })
    })
  }

  assumeWebAppIdentityWithToken(token) {
    const that = this

    const params = {
      DurationSeconds: 3600,
      ProviderId: 'www.amazon.com',
      RoleArn: this.loginConfig.webAppRole,
      RoleSessionName: this.loginConfig.sessionName,
      WebIdentityToken: token,
    }

    console.log(params)

    return new Promise((resolve, reject) => {
      that.sts.assumeRoleWithWebIdentity(params, (err, data) => {
        if (err) { reject(err) }
        resolve(data)
      })
    })
  }

  loginClicked() {
    const that = this
    this.sts = new AWS.STS()

    this.authAmazonLogin()
      .then((loginResponse) => {
        that.accessToken = loginResponse.access_token
        return that.assumeWebAppIdentityWithToken(loginResponse.access_token)
      })
      .then((identity) => {
        console.log('identity')
        console.log(identity)

        that.webApplicationIdentityCredentials = {
          accessKeyId: identity.Credentials.AccessKeyId,
          secretAccessKey: identity.Credentials.SecretAccessKey,
          sessionToken: identity.Credentials.SessionToken,
        }

        return that.retrieveProfile()
      })
      .then((profile) => {
        that.setState({
          profile: {
            id: profile.CustomerId,
            email: profile.PrimaryEmail,
            name: profile.Name,
          },
        })

        that.aws = AWS
        AWS.config.credentials = that.webApplicationIdentityCredentials
        AWS.config.region = that.loginConfig.awsRegion

        return that.sendUserLogin()
      })
      .then(() => {
        that.props.awsLoginComplete(that)
      })
  }

  retrieveProfile() {
    return new Promise((resolve, reject) => {
      window.amazon.Login.retrieveProfile(this.accessToken, (response) => {
        if (!response.success) {
          reject('Failed to get Amazon Login profile')
        } else {
          resolve(response.profile)
        }
      })
    })
  }

  sendUserLogin() {
    this.makeApiRequest(config.UserInfoAPI, 'POST', '/login-user/', {
      schema: 'com.nordstrom/user-info/login/1-0-0',
      id: this.state.profile.id,
      name: this.state.profile.name,
    })
  }

  makeApiRequest(api, verb, path, data) {
    return new Promise((resolve, reject) => {
      // https://{restapi_id}.execute-api.{region}.amazonaws.com/{stage_name}/
      const apiPath = `/${config.Stage}${path}`
      const body = JSON.stringify(data)
      const hostname = `${api}.execute-api.${config.AWSRegion}.amazonaws.com`
      const endpoint = new AWS.Endpoint(hostname)
      const request = new AWS.HttpRequest(endpoint)

      request.method = verb
      request.path = apiPath
      request.region = config.AWSRegion
      request.host = endpoint.host
      request.body = body
      request.headers.Host = endpoint.host

      const signer = new AWS.Signers.V4(request, 'execute-api')
      signer.addAuthorization(this.webApplicationIdentityCredentials, new Date())

      const postRequest = https.request(request, (response) => {
        let result = ''
        response.on('data', d => (result += d))
        response.on('end', () => resolve(result))
        response.on('error', error => reject(error))
      })

      postRequest.write(body)
      postRequest.end()
    })
  }

  assumeProductCatalogReaderRole() {
    const that = this

    const params = {
      RoleArn: this.loginConfig.catalogReaderRole,
      RoleSessionName: this.loginConfig.sessionName,
    }

    console.log('that.webApplicationIdentityCredentials')
    console.log(that.webApplicationIdentityCredentials)
    that.sts.config.credentials = that.webApplicationIdentityCredentials

    return new Promise((resolve, reject) => {
      that.sts.assumeRole(params, (err, data) => {
        if (err) {
          console.error(`Failed to assume ProductCatalogReader role: ${err}`)
          reject(err)
        } else {
          resolve(data)
        }
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
