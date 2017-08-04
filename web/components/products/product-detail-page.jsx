import React, { Component } from 'react'
import { connect } from 'react-redux'
import { browserHistory } from 'react-router'
import config from 'config'
import { loadProductById, clearProductById } from 'actions'

class ProductDetailPage extends Component {
  constructor(props) {
    super(props)
    this.purchaseProduct = this.purchaseProduct.bind(this)
    this.state = {
      buyMessage: null,
    }
  }

  componentWillMount() {
    const { dispatch, params: { id } } = this.props
    console.log('product id', id)
    dispatch(loadProductById(id))
  }

  componentWillUnmount() {
    const { dispatch } = this.props
    dispatch(clearProductById())
  }

  purchaseProduct() {
    this.props.awsLogin.makeApiRequest(config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/product/purchase/1-0-0',
      id: this.props.params.id,
      origin: `hello-retail/web-client-purchase-product/${this.props.awsLogin.state.profile.id}/${this.props.awsLogin.state.profile.name}`,
    })
      .then(() => {
        // browserHistory.push('/categories/')
        this.setState({
          buyMessage: 'Order Placed.',
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
      buyMessage: 'Please wait...',
    })
  }

  render() {
    const { product: { name, brand, description, image } } = this.props

    let buyContent = null
    if (!this.state.buyMessage) {
      buyContent = <button className="button" onClick={this.purchaseProduct}>Buy</button>
    } else {
      buyContent = <h4>{this.state.buyMessage}</h4>
    }

    return (
      <div>
        <div>
          <h3>{brand}</h3>
          <h4>{name}</h4>
          <div>{description}</div>
          <div>
            { image ? (<img className="productImage" src={image} alt={name} />) : null }
          </div>
          <br />

          <div className="row small-6">
            <div>{buyContent}</div>
            <div>
              <button className="button" onClick={browserHistory.goBack}>Back to List</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(state => ({
  product: state.product,
}))(ProductDetailPage)
