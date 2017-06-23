import React, { Component, PropTypes } from 'react'
import { IndexLink, Link } from 'react-router'

class RoleSelectionPage extends Component {
  static propTypes = {
    name: PropTypes.string,
  }

  static defaultProps = {
    name: null,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    // eslint-ignore-next-line react/prop-types
    return (
      <header className="top-bar navigation">
        <nav className="menu-centered">
          <ul className="menu" data-dropdown-menu>
            <li><IndexLink to={'/'} activeClassName="active">Shop</IndexLink></li>
            <li><Link to={'/merchant/'} activeClassName="active">Merchant</Link></li>
            <li><Link to={'/photographer/'} activeClassName="active">Photographer</Link></li>
          </ul>
          { this.props.name ? (<div><small><em>Welcome {this.props.name}</em></small></div>) : null }
        </nav>
      </header>
    )
  }
}

export default RoleSelectionPage
