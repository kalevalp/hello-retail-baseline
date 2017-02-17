import React, { Component } from 'react'

class NewProductPage extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <div>
        <h4><em>Create New Product</em></h4>

        <div>
          <label htmlFor="category">Category:</label>
          <br />
          <input id="category" />
        </div>
        <div>
          <label htmlFor="name">Name:</label>
          <br />
          <input id="name" />
        </div>
        <div>
          <label htmlFor="brand">Brand:</label>
          <br />
          <input id="brand" />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <br />
          <input id="description" />
        </div>
        <button>Add Product</button>
      </div>
    )
  }
}

export default NewProductPage
