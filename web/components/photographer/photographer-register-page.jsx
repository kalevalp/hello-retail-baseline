import React, { Component } from 'react'

class PhotographerRegisterPage extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <div>
        <h4><em>Photographer Registration</em></h4>
        <div>
          <label htmlFor="phone">Phone Number:</label>
          <br />
          <input id="phone" />
        </div>
        <button>Register</button>
      </div>
    )
  }
}

export default PhotographerRegisterPage
