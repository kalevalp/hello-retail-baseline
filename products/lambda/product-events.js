'use strict'

const KinesisEventWriter = require('./scrape-products/kinesis-event-writer.js')

class ProductEvents {
  static sendCreateEvent(product) {
    ProductEvents.kinesisEventWriter.writeKinesisEvent(
      {
        schema: 'com.nordstrom/product/create/1-0-0',
        id: product.id.toString(),
        brand: product.brand,
        name: product.name,
        description: product.description,
        category: product.category,
      },
      product.id,
    )
  }
}

ProductEvents.kinesisEventWriter = new KinesisEventWriter()

module.exports = ProductEvents
