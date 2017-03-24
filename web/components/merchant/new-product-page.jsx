import React, { Component, PropTypes } from 'react'
import ValidationErrors from '../validation-errors'
import config from '../../config'

class NewProductPage extends Component {
  // TODO: DRY up all these duplicate propType declarations everywhere
  static propTypes = {
    awsLogin: PropTypes.shape({
      state: PropTypes.shape({
        profile: PropTypes.shape({
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

    this.categoryChange = this.handleProductChange.bind(this, 'category')
    this.nameChange = this.handleProductChange.bind(this, 'name')
    this.brandChange = this.handleProductChange.bind(this, 'brand')
    this.descriptionChange = this.handleProductChange.bind(this, 'description')
    this.validateProduct = this.validateProduct.bind(this)
    this.resetProduct = this.resetProduct.bind(this)
    this.createProduct = this.createProduct.bind(this)
    this.ackCreateProduct = this.ackCreateProduct.bind(this)

    this.emptyProduct = {
      category: '',
      name: '',
      brand: '',
      description: '',
    }

    this.state = this.emptyProduct
    this.state.submittedProduct = false
    this.state.errors = []
  }

  validateProduct(property, value) {
    const product = this.state

    // Quick fix-up of changed property, not yet reflected in actual state.
    product[property] = value

    this.setState({
      // Just need to have at least one alphanumeric in each field
      isProductValid: (
        product.category && product.category.match(/^[\w\d]+/)
        && product.name && product.name.match(/^[\w\d]+/)
        && product.brand && product.brand.match(/^[\w\d]+/)
        && product.description && product.description.match(/^[\w\d]+/)
      ),
    })
  }

  resetProduct() {
    this.setState({
      submittedProduct: true,
      category: '',
      name: '',
      brand: '',
      description: '',
    })
  }

  createProduct() {
    const product = this.state

    // Disable "Add Product" button while request is in flight
    this.setState({
      isProductValid: false,
    })

    this.props.awsLogin.makeApiRequest(config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/product/create/1-0-0',
      id: (`0000000${Math.floor(Math.abs(Math.random() * 10000000))}`).substr(-7),
      origin: `hello-retail/web-client-create-product/${this.props.awsLogin.state.profile.email}/${this.props.awsLogin.state.profile.name}`,
      category: product.category,
      name: product.name,
      brand: product.brand,
      description: product.description,
    })
    .then(this.resetProduct)
    .catch((error) => {
      // Show error message and re-enable button so user can try again.
      this.setState({
        isProductValid: true,
        errors: [error],
      })
    })
  }

  ackCreateProduct() {
    this.resetProduct()
    this.setState({
      submittedProduct: false,
    })
  }

  handleProductChange(property, event) {
    this.setState({
      [property]: event.target.value,
    })
    this.validateProduct(property, event.target.value)
  }

  render() {
    if (this.state.submittedProduct) {
      return (
        <div>
          <h4>Product {this.state.name} has been created!</h4>
          <p>Press OK to add another product.</p>
          <button onClick={this.ackCreateProduct}>OK</button>
        </div>
      )
    }

    return (
      <div>
        <h4><em>Create New Product</em></h4>
        <div>
          <label>
            Category:
            <input value={this.state.category} onChange={this.categoryChange} />
          </label>
        </div>
        <div>
          <label>
            Name:
            <input value={this.state.name} onChange={this.nameChange} />
          </label>
        </div>
        <div>
          <label>
            Brand:
            <input value={this.state.brand} onChange={this.brandChange} />
          </label>
        </div>
        <div>
          <label>
            Description:
            <input value={this.state.description} onChange={this.descriptionChange} />
          </label>
        </div>
        <ValidationErrors errors={this.state.errors} />
        <button disabled={!this.state.isProductValid} onClick={this.createProduct}>Add Product</button>
      </div>
    )
  }
}

export default NewProductPage
