import React, {Component, PropTypes} from 'react'; // eslint-disable-line import/no-extraneous-dependencies
import loadjs from 'loadjs' // eslint-disable-line import/no-extraneous-dependencies

class AmazonLogin extends Component {
  static propTypes = {
    dynamoDbReady: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      // TODO: Derive this information from configuration at build-time, including stage-dependent ones
      // TODO: And don't need to use state
      catalogReaderRole: 'arn:aws:iam::515126931066:role/demoProductCatalogReader',
      clientId: 'amzn1.application-oa2-client.d38cc5e49f9343b5b7a718f9d21fc93a',
      dynamoDbRegion: 'us-west-2',
      sessionName: 'hello-retail-web-app',
      webAppRole: 'arn:aws:iam::515126931066:role/demoHelloRetailWebIdentity',
    };

    this.componentWillMount = this.componentWillMount.bind(this)
    this.assumeWebAppIdentityWithToken = this.assumeWebAppIdentityWithToken.bind(this)
    this.authAmazonLogin = this.authAmazonLogin.bind(this)
    this.assumeProductCatalogReaderRole = this.assumeProductCatalogReaderRole.bind(this)
    this.componentWillMount = this.componentWillMount.bind(this)
  }

  assumeWebAppIdentityWithToken(sts, token) {
    const params = {
      DurationSeconds: 3600,
      ProviderId: 'www.amazon.com',
      RoleArn: this.state.webAppRole,
      RoleSessionName: this.state.sessionName,
      WebIdentityToken: token,
    }

    return new Promise((resolve, reject) => {
      sts.assumeRoleWithWebIdentity(params, (err, data) => {
        if (err) { reject(err) }
        resolve(data)
      })
    })
  }

  authAmazonLogin() {
    return new Promise((resolve, reject) => {
      amazon.Login.setClientId(this.state.clientId)
      const options = { scope: 'profile' }
      amazon.Login.authorize(options, (response) => {
        if (response.error) { reject(response.error) }
        resolve(response)
      })
    })
  }

  assumeProductCatalogReaderRole(sts, creds) {
    const params = {
      RoleArn: this.state.catalogReaderRole,
      RoleSessionName: this.state.sessionName,
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


  componentWillMount() {
    const amazonLogin = this;
    window.onAmazonLoginReady = () => {
      const sts = new AWS.STS()

      this.authAmazonLogin()
        .then(loginResponse => this.assumeWebAppIdentityWithToekn(sts, loginResponse.access_token))
        .then(identity => this.assumeProductCatalogReaderRole(sts, identity.Credentials))
        .then((role) => {
          AWS.config.credentials = {
            accessKeyId: role.Credentials.AccessKeyId,
            secretAccessKey: role.Credentials.SecretAccessKey,
            sessionToken: role.Credentials.SessionToken,
          }

          AWS.config.region = this.state.dynamoDbRegion

          amazonLogin.props.dynamoDbReady(new AWS.DynamoDB())
        })
    }

    loadjs('https://api-cdn.amazon.com/sdk/login1.js')
  }

  render() {
    return (
      <div />
    );
  }
}

export default AmazonLogin;
