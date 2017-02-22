'use strict'

const AWS = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies
const ProductSource = require('./scrape-store-website-product-source')
const Product = require('../product')
const ProductEvents = require('../product-events')

const constants = {
  LAMBDA_TIMEOUT_MAX: 5 * 60 * 1000,
}

module.exports = {
  handler: (event, context, callback) => {
    if (
      !event || !event.lambdaTimeout || !(typeof event.lambdaTimeout === 'number') || event.lambdaTimeout <= 0 || !event.productFrequency || !(typeof event.productFrequency === 'number') || event.productFrequency <= 0
    ) {
      callback('Invalid timeout or scrap frequency. Both must be positive numbers.')
    } else if (!event.local && event.lambdaTimeout > constants.LAMBDA_TIMEOUT_MAX) {
      callback(`Requested lambdaTimeout exceeds Lambda timeout maximum (${constants.LAMBDA_TIMEOUT_MAX}).`)
    } else {
      const ps = new ProductSource()
      const kinesis = new AWS.Kinesis()

      kinesis.config.credentials = new AWS.TemporaryCredentials({
        RoleArn: process.env.STREAM_WRITER_ROLE,
      })

      const productEvents = new ProductEvents(kinesis)

      const oneProductInterval = setInterval(
        () => {
          ps.nextProduct((scraped) => {
            const product = new Product(
              scraped.Id.toString(),
              scraped.Title,
              scraped.Brand.Label,
              scraped.category,
              `PAGE:${scraped.ProductPageUrl}`
            )
            productEvents.sendCreateEvent(product)
          })
        },
        event.productFrequency
      )

      setTimeout(
        () => {
          clearInterval(oneProductInterval)
          callback(null, 'product scraping complete')
        },
        event.lambdaTimeout
      )
    }
  },

  /*

  {
    "body": "{       \"product\": {           \"id\": 1000000,           \"name\": \"Test Product Name\",           \"brand\": \"Test Product Brand\",           \"category\": \"Test Category\",           \"description\": \"Another fine product!\"       } }"
  }
   */

  handlerPostEvent: (event, context, callback) => {

    const productInfo = JSON.parse(event.body).product
    const product = new Product(
      productInfo.id,
      productInfo.name,
      productInfo.brand,
      productInfo.category,
      productInfo.description
    )

    const kinesis = new AWS.Kinesis()

    kinesis.config.credentials = new AWS.TemporaryCredentials({
      RoleArn: process.env.STREAM_WRITER_ROLE,
    })

    const productEvents = new ProductEvents(kinesis)

    productEvents.sendCreateEvent(product)
      .then((sequence) => {
        const message = `Added product id:${product.id}, sequence:${sequence}`

        context.succeed({
           'statusCode ': 200,
           'headers ': {  },
           'body ':  message
        })

        callback(null,  message)
      })
      .catch((error) => {
        console.log(JSON.stringify(error))
      })
  }
}
