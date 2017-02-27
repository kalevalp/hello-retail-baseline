import { Component, PropTypes } from 'react'

class UserInfo extends Component {
  // TODO: Dry these declarations up
  static propTypes = {
    awsLogin: PropTypes.shape({
      state: PropTypes.shape({
        profile: PropTypes.shape({
          id: PropTypes.string,
        }),
        amazonLoginReady: PropTypes.bool,
      }),
      makeApiRequest: PropTypes.func,
    }).isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  sendUpdatePhoneEvent(phoneNumber) {
    this.props.awsLogin.makeApiRequest('POST', '/update-phone/', {
      schema: 'com.nordstrom/user-info/update-phone/1-0-0',
      id: this.state.profile.id,
      phone: phoneNumber,
    })
  }

  render() {
    return null
  }
}

export default UserInfo
