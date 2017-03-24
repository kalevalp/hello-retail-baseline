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
          email: PropTypes.string,
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
      origin: `hello-retail/web-client-update-phone/${this.props.awsLogin.state.profile.email}/${this.props.awsLogin.state.profile.name}`,
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
        <h4><em>Photographer Registration</em></h4>
        <div>
          <label>
            Phone Number:
            <input value={this.state.phoneNumber} onChange={this.phoneNumberChange} />
            <br />
            <h5>(Additional charges may apply.)</h5>
          </label>
          <br />
          <ValidationErrors errors={this.state.errors} />
          <button disabled={!this.state.isPhoneNumberValid} onClick={this.registerPhotographer}>Register</button>
        </div>
      </div>
    )
  }
}

export default PhotographerRegisterPage
