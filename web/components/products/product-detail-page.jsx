import React, { Component, PropTypes } from 'react'
import { browserHistory } from 'react-router'
import ProductDataSource from './product-data-source'
import ValidationErrors from '../validation-errors'
import config from '../../config'

class ProductDetailPage extends Component {
  static propTypes = {
    awsLogin: PropTypes.shape({
      state: PropTypes.shape({
        profile: PropTypes.shape({
          email: PropTypes.string,
          name: PropTypes.string,
        }),
      }),
      makeApiRequest: PropTypes.func,
    }).isRequired,
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.productsLoaded = this.productsLoaded.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
    this.state.errors = []
    this.state.buyMessage = null
  }

  productsLoaded(products) {
    const p = products[0]
    this.setState({
      name: p.name,
      brand: p.brand,
      description: p.description,
      id: p.id,
      image: `https://${p.image}`,
    })
  }

  purchaseProduct() {
    this.props.awsLogin.makeApiRequest(config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/product/purchase/1-0-0',
      id: this.props.params.id,
      origin: `hello-retail/web-client-purchase-product/${this.props.awsLogin.state.profile.email}/${this.props.awsLogin.state.profile.name}`,
    })
      .then(() => {
        // browserHistory.push('/categories/')
        this.setState({
          buyMessage: 'Bought it!',
        })
      })
      .catch((error) => {
        // Show error message and re-enable button so user can try again.
        console.log(error)
        this.setState({
          errors: [error],
        })
      })

    this.setState({
      buyMessage: 'Submitting order.',
    })
  }

  render() {
    // TODO: Add query for single product by id
    // TODO: Add image

    let blurb = null
    if (!this.state.buyMessage) {
      blurb = <button onClick={this.purchaseProduct}>Buy</button>
    } else {
      blurb = <h4>{this.state.buyMessage}</h4>
    }

    const backButtonStyle = {
      margin: '15px',
    }

    return (
      <div>
        <div>
          <h3>{this.state.brand}</h3>
          <h4>{this.state.name}</h4>
          <div>{this.state.description}</div>
          <div>
            { this.state.image ? (<img className="productImage" src={this.state.image} alt={this.state.name} />) : null }
          </div>
          <br />
          <ValidationErrors errors={this.state.errors} />
          {blurb}
          <ProductDataSource awsLogin={this.props.awsLogin} productId={this.props.params.id} productsLoaded={this.productsLoaded} />
          <button style={backButtonStyle} onClick={browserHistory.goBack}>Back to List</button>
        </div>
      </div>
    )
  }
}

export default ProductDetailPage
