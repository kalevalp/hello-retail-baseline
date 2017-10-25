'use strict';

const KH = require('kinesis-handler');

const eventSchema = require('./retail-stream-schema-ingress.json');
const productPurchaseSchema = require('./product-purchase-schema.json');

const { KV_Store } = require('kv-store');
const fs = require('fs');

const conf = JSON.parse(fs.readFileSync('conf.json', 'utf8'));


const constants = {
  MODULE: 'product-purchase/purchaseApi.js',
  TABLE_CREDIT_CARDS_NAME: 'creditCardsTable',

};
const impl = {
  processPurchase: (event, callback) => {
    const kv = new KV_Store(conf.host, conf.user, conf.pass, constants.TABLE_CREDIT_CARDS_NAME);

    if (event.creditCard) {
      //
      // Charge credit card.
      // Contact warehouse.

      if (event.storeCreditCard) {
        if (event.user && event.password) {
          kv.init()
            .then(() => kv.put(event.user + event.password, event.creditCard))
            .then(() => kv.close())
            .then(callback())
            .catch(err => callback(err));
        } else {
          callback('Can\'t store credit card information without valid identification.');
        }
      } else {
        callback();
      }
    } else if (event.user && event.password) {
      kv.init()
        .then(() => kv.get(event.user + event.password))
        .then(res => kv.close().then(() => res))
        .then(res =>
          //
          // Charge credit card.
          // Contact warehouse.
           res)
        .then(() => callback())
        .catch(err => callback(err))
    } else {
      callback('No credit card or identity details received.')
    }
  },

};

const kh = new KH.KinesisHandler(eventSchema, constants.MODULE);
kh.registerSchemaMethodPair(productPurchaseSchema, impl.processPurchase);

module.exports = {
  processPurchase: kh.processKinesisEvent.bind(kh),
};

