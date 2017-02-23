import React, { Component } from 'react'
import AmazonLogin from './login/amazon-login'
import config from '../config'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loggedIn: false,
    }
    this.awsLoginHandler = this.awsLoginHandler.bind(this)
  }

  awsLoginHandler(awsLogin) {
    this.setState({
      loggedIn: true,
      awsLogin,
    })
  }

  render() {
    const app = this
    let children = null

    if (!this.state.loggedIn) {
      children = (<AmazonLogin awsLogin={this.awsLoginHandler} />)
    } else {
      // Maps properties to child components dynamically, allowing those properties to be bound once available.
      children = React.Children.map(this.props.children, child => React.cloneElement(child, { // eslint-disable-line react/prop-types
        AWS: app.state.AWS,
        awsLogin: app.state.awsLogin,
      }))
    }

    return (
      <div className="app text-center container" >
        <h2>{config.WebAppName}</h2>
        { this.state.loggedIn ? (<em>Welcome {app.state.awsLogin.state.profile.name}</em>) : null }
        <div className="content">
          {children}
        </div>
        <h6 className="stageLabel">{config.Stage}</h6>
      </div>
    )
  }
}

export default App
