import React, { Component } from 'react'
import AmazonLogin from './login/amazon-login'
import Navigation from './navigation/navigation'
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

    const renderContent = () => {
      if (!this.state.loggedIn) {
        children = (<AmazonLogin awsLoginComplete={this.awsLoginHandler} />)
      } else {
        // Maps properties to child components dynamically, allowing those properties to be bound once available.
        children = React.Children.map(this.props.children, child => React.cloneElement(child, { // eslint-disable-line react/prop-types
          AWS: app.state.AWS,
          awsLogin: app.state.awsLogin,
        }))
      }

      return (<div className="content">
        {children}
      </div>)
    }

    return (
      <div>
        <div className="app-title-container small-6 row">
          <h1 className="column align-self-middle">{config.WebAppName}</h1>
        </div>

        {this.state.loggedIn ? <Navigation name={app.state.awsLogin.state.profile.name} /> : null}

        <div className="app text-center container" >
          {renderContent()}
          {config.Stage !== 'prod' ? (<h6 className="stageLabel">stage:{config.Stage}</h6>) : null}
        </div>
      </div>
    )
  }
}

export default App
