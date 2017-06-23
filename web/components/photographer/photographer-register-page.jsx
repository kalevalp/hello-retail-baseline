import React, { Component, PropTypes } from 'react'
import ValidationErrors from '../validation-errors'
import config from '../../config'

class PhotographerRegisterPage extends Component {
  // TODO: DRY up all these duplicate propType declarations everywhere
  static propTypes = {
    awsLogin: PropTypes.shape({
      state: PropTypes.shape({
        profile: PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
        }),
      }),
      makeApiRequest: PropTypes.func,
    }),
  }

  static defaultProps = {
    awsLogin: null,
  }

  constructor(props) {
    super(props)
    this.state = {
      registered: false,
      phoneNumber: '',
      validPhoneNumber: false,
      errors: [],
    }
    this.registerPhotographer = this.registerPhotographer.bind(this)
    this.phoneNumberChange = this.phoneNumberChange.bind(this)
    this.render = this.render.bind(this)
  }

  registerPhotographer() {
    const phoneNumber = this.state.phoneNumber

    // Disable the submit button while request is in flight
    this.setState({
      validPhoneNumber: false,
    })

    // Call user-info api with update-phone event
    this.props.awsLogin.makeApiRequest(config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/user-info/update-phone/1-0-0',
      id: this.props.awsLogin.state.profile.id,
      phone: phoneNumber,
      origin: `hello-retail/web-client-update-phone/${this.props.awsLogin.state.profile.id}/${this.props.awsLogin.state.profile.name}`,
    })
    .then(() => {
      this.setState({
        registered: true,
      })
    })
    .catch((error) => {
      // Show error message and re-enable submit button so user can try again.
      this.setState({
        validPhoneNumber: true,
        errors: [error],
      })
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
          <ValidationErrors errors={this.state.errors} />
          <button className="button" disabled={!this.state.isPhoneNumberValid} onClick={this.registerPhotographer}>Register</button>
        </div>
      </div>
    )
  }
}

export default PhotographerRegisterPage
