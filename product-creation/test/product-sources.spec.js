'use strict'

const expect = require('chai').expect
const ProductSource = require('./../lambda/scrape-products/scrape-store-website-product-source')

describe('The store scraping from the website ProductSource', function () {
  it('class is exported', function () {
    expect(ProductSource).to.not.be.null
  })
})
