import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createNewProduct } from 'actions'

class CreateProduct extends Component {
  constructor(props) {
    super(props)

    this.categoryChange = this.handleProductChange.bind(this, 'category')
    this.nameChange = this.handleProductChange.bind(this, 'name')
    this.brandChange = this.handleProductChange.bind(this, 'brand')
    this.descriptionChange = this.handleProductChange.bind(this, 'description')
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
    const { dispatch, userId, userName } = this.props

    // Disable "Add Product" button while request is in flight
    this.setState({
      isProductValid: false,
    })

    dispatch(createNewProduct(userId, userName, product))

    this.resetProduct()
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
          <h2>Product {this.state.name} has been created!</h2>
          <button className="button" onClick={this.ackCreateProduct}>Add More</button>
        </div>
      )
    }

    const renderInput = (displayName, control) => (
      <div className="expanded row column small-7 medium-5 large-4">
        {control}
      </div>
    )

    const renderTextInput = (inputName, displayName, handler) =>
      renderInput(displayName, <input className="small-12 medium-text-left input-space" id="category" value={inputName} onChange={handler} placeholder={displayName} />)

    const renderTextAreaInput = (inputName, displayName, rows, handler) =>
      renderInput(displayName, <textarea rows={rows} className="small-12 medium-text-left" id="category" value={inputName} onChange={handler} placeholder={`Enter ${displayName} here...`} />)

    return (
      <div>
        <h3>Create New Product</h3>
        {renderTextInput(this.state.category, 'Category', this.categoryChange)}
        {renderTextInput(this.state.name, 'Name', this.nameChange)}
        {renderTextInput(this.state.brand, 'Brand', this.brandChange)}
        {renderTextAreaInput(this.state.description, 'Description', 10, this.descriptionChange)}
        <button className="button" disabled={!this.state.isProductValid} onClick={this.createProduct}>Add Product</button>
      </div>
    )
  }
}

export default connect(state => ({
  userId: state.login.customerId,
  userName: state.login.customerName,
}))(CreateProduct)
