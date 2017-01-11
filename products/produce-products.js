"use strict";

console.log(JSON.stringify(process.env,null,2));


const AWS = require('aws-sdk');
const ProductSource = require('./scrape-store-website-product-source').ProductSource;

function createEnvelopeEvent() {
  return {
    schema: 'com.nordstrom/retail-stream/1-0-0',
    origin: 'hello-retail/product-producer-automation',
    timeOrigin: new Date().toISOString(),
  };
}

exports.handler = (event, context, callback) => {
    let ps = new ProductSource();
    let productCount = 0;
    let errorCount = 0;

    const kinesis = new AWS.Kinesis();

    kinesis.config.credentials = new AWS.TemporaryCredentials({
      RoleArn: process.env.STREAM_WRITER_ROLE,
    });


    let oneProductInterval = setInterval(function() {
      ps.nextProduct(function(product) {
        console.log(product);

        let newProduct = createEnvelopeEvent();
        newProduct.data = {
          schema: 'com.nordstrom/product-create/1-0-0',
          id: product.Id.toString(),
          brand: product.Brand.Label,
          name: product.Title,
          description: `PAGE:${product.ProductPageUrl}`,
          category: product.category,
        };

        console.log(newProduct);

        let newProductCreatedEvent = {
          Data: JSON.stringify(newProduct),
          PartitionKey: `${newProduct.Id}`,
          StreamName: process.env.STREAM_NAME,
        };

        kinesis.putRecord(newProductCreatedEvent, function(err, data) {
          productCount++;

          if(data) {
            console.log(data);
          }

          if (err) {
            errorCount++;
            console.error(err);
          }
        });
      });
    }, event.productFrequency);

    let lambdaTimeout = setTimeout(function() {
      clearInterval(oneProductInterval);
      callback(null, `${productCount} products produced, ${errorCount} errors`);
    }, event.lambdaTimeout);
};
