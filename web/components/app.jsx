import React from 'react'
import * as Redux from 'react-redux'
import AmazonLogin from 'AmazonLogin'
import Navigation from 'Navigation'
import config from 'config'

export const App = (props) => {
  const { loggedIn, children, customerName } = props

  return (
    <div>
      <div className="app-title-container small-6 row">
        <h1 className="column align-self-middle">{config.WebAppName}</h1>
      </div>

      {loggedIn ? <Navigation name={customerName} /> : null}

      <div className="app text-center container" >
        <div className="content">
          {loggedIn ? children : <AmazonLogin />}
        </div>
        {config.Stage !== 'prod' ? (<h6 className="stageLabel">stage:{config.Stage}</h6>) : null}
      </div>
    </div>
  )
}

export default Redux.connect(state => ({
  customerName: state.login.customerName,
  loggedIn: state.aws.roleAssumed,
}))(App)
