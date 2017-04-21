import React, { Component } from 'react'
import { Link } from 'react-router'
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
      children = (<AmazonLogin awsLoginComplete={this.awsLoginHandler} />)
    } else {
      // Maps properties to child components dynamically, allowing those properties to be bound once available.
      children = React.Children.map(this.props.children, child => React.cloneElement(child, { // eslint-disable-line react/prop-types
        AWS: app.state.AWS,
        awsLogin: app.state.awsLogin,
      }))
    }

    return (
      <div>
        <Link className="homeLink glyphicon glyphicon-home" to={'/'} />
        <div className="app text-center container" >
          <h1>{config.WebAppName}</h1>
          { this.state.loggedIn ? (<h4>Welcome <em>{app.state.awsLogin.state.profile.name}</em></h4>) : null }
          <hr />
          <div className="content">
            {children}
          </div>
          {config.Stage !== 'prod' ? (<h6 className="stageLabel">{config.Stage}</h6>) : null }
        </div>
      </div>
    )
  }
}

export default App
