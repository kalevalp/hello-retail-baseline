import React, { Component } from 'react'
import { connect } from 'react-redux'
import { registerPhotographer } from 'actions'

class PhotographerRegisterPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      registered: false,
      phoneNumber: '',
      validPhoneNumber: false,
    }
    this.registerPhotographer = this.registerPhotographer.bind(this)
    this.phoneNumberChange = this.phoneNumberChange.bind(this)
  }

  registerPhotographer() {
    const { dispatch, userId, userName } = this.props
    const phoneNumber = this.state.phoneNumber

    dispatch(registerPhotographer(userId, userName, phoneNumber))

    this.setState({
      registered: true,
    })
  }

  phoneNumberChange(event) {
    // Regardless of formatting valid numbers are 10 digits
    const phoneNumber = event.target.value.replace(/\D/g, '').substr(0, 10)
    const isPhoneNumberValid = (phoneNumber.match(/^\d{10}$/) !== null)

    this.setState({
      phoneNumber,
      isPhoneNumberValid,
    })
  }

  render() {
    if (this.state.registered) {
      return (
        <div>
          <h4>Thanks for registering!</h4>
          <p>You will get text messages to inform you of products that need their pictures taken.</p>
        </div>
      )
    }

    return (
      <div>
        <h3>Photography Registration</h3>
        <p className="small-8 medium-6 large-4 small-centered">
          Enter your phone number and we will send you text messages to take photos of products for the store!
          Just reply to the text message with the picture of the requested product.
        </p>
        <div className="expanded row column small-7 medium-5 large-4">
          <input className="small-12 medium-text-left" value={this.state.phoneNumber} onChange={this.phoneNumberChange} placeholder="Phone Number" />
          <h6><small>(Additional texting and data charges may apply!)</small></h6>
          <button className="button" disabled={!this.state.isPhoneNumberValid} onClick={this.registerPhotographer}>Register</button>
        </div>
      </div>
    )
  }
}

export default connect(state => ({
  userId: state.login.customerId,
  userName: state.login.customerName,
}))(PhotographerRegisterPage)
