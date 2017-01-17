'use strict';

const AWS = require('aws-sdk');
const ProductSource = require('./scrape-store-website-product-source').ProductSource;
const Product = require('../product');
const ProductEvents = require('../product-events');

exports.handler = (event, context, callback) => {
  const ps = new ProductSource();
  const productCount = 0;
  const errorCount = 0;

  const kinesis = new AWS.Kinesis();

  kinesis.config.credentials = new AWS.TemporaryCredentials({
    RoleArn: process.env.STREAM_WRITER_ROLE,
  });

  const oneProductInterval = setInterval(() => {
    ps.nextProduct((scraped) => {
      const product = new Product(
        scraped.Id.toString(),
        scraped.Title,
        scraped.Brand.Label,
        scraped.category,
        `PAGE:${scraped.ProductPageUrl}`
      );

      ProductEvents.sendCreateEvent(product);
    });
  }, event.productFrequency);

  setTimeout(() => {
    clearInterval(oneProductInterval);
    callback(null, `${productCount} products produced, ${errorCount} errors`);
  }, event.lambdaTimeout);
};
