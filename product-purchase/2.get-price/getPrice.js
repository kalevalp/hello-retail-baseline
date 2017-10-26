'use strict';

const { KV_Store } = require('kv-store');
const fs = require('fs');

const conf = JSON.parse(fs.readFileSync('conf.json', 'utf8'));

const constants = {
  TABLE_PRODUCT_PRICE_NAME: process.env.TABLE_PRODUCT_PRICE_NAME,
};


module.exports.handler = (event, context, callback) => {
  const kv = new KV_Store(conf.host, conf.user, conf.pass, constants.TABLE_PRODUCT_PRICE_NAME);
  const result = event;

  kv.init()
    .then(() => kv.get(event.id))
    .then(res => kv.close().then(() => res))
    .then((res) => {
      if (res) {
        // const price = JSON.parse(res).price;

        if (res) {
          result.gotPrice = 'true';
          result.price = res;
        } else {
          result.gotPrice = 'false';
          result.failureReason = 'No price in the catalog';
        }
      } else {
        result.gotPrice = 'false';
        result.failureReason = 'Product not in catalog';
      }
      callback(null, result)
    })
    .catch(err => callback(err))
};
