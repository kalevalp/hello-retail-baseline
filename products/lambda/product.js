'use strict'

class Product {
  constructor(id, name, brand, category, description) {
    this.id = id
    this.name = name
    this.brand = brand
    this.category = category
    this.description = description
  }

  toString() {
    return `Product ${this.id}:${this.brand}, ${this.name} in ${this.category} "${this.description}"`
  }
}

module.exports = Product
