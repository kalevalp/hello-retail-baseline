/* global window */
import loadjs from 'loadjs'
import * as React from 'react'
import * as Redux from 'react-redux'
import * as actions from 'actions'

export class AmazonLogin extends React.Component {
  constructor(props) {
    super(props)

    this.loginClicked = this.loginClicked.bind(this)

    this.state = {
      amazonLoginReady: false,
    }
  }

  componentWillMount() {
    const that = this
    const { dispatch } = this.props

    window.onAmazonLoginReady = () => {
      that.setState({
        amazonLoginReady: true,
      })

      dispatch(actions.userLoginReady(window.amazon.Login, 'never'))
    }

    loadjs('https://api-cdn.amazon.com/sdk/login1.js')
  }

  loginClicked() {
    const { dispatch } = this.props
    dispatch(actions.userLoginReady(window.amazon.Login, 'auto'))
  }

  render() {
    if (!this.state.amazonLoginReady) {
      return (<div> Waiting for Amazon Login...</div>)
    }

    return (
      <div id="amazon-root">
        <button onClick={this.loginClicked} className="awsLoginButton">
          <img
            src="https://images-na.ssl-images-amazon.com/images/G/01/lwa/btnLWA_gold_156x32.png"
            disabled={!this.state.amazonLoginReady}
            alt="Amazon Login"
          />
        </button>
      </div>
    )
  }
}

export default Redux.connect()(AmazonLogin)
