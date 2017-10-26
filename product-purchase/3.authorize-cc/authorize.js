'use strict';

const { KV_Store } = require('kv-store');
const fs = require('fs');

const conf = JSON.parse(fs.readFileSync('conf.json', 'utf8'));

const constants = {
  TABLE_CREDIT_CARDS_NAME: process.env.TABLE_CREDIT_CARDS_NAME,
};

module.exports.handler = (event, context, callback) => {
  console.log(event);
  const result = event;
  if (event.creditCard) {
    if (Math.random() < 0.01) { // Simulate failure in 1% of purchases (expected).
      result.approved = 'false';
      result.failureReason = 'Credit card authorization failed';
    } else {
      result.approved = 'true';
      result.authorization = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }
    return callback(null, result);
  } else {
    const kv = new KV_Store(conf.host, conf.user, conf.pass, constants.TABLE_CREDIT_CARDS_NAME);

    return kv.init()
      .then(() => kv.get(event.user))
      .then(cc => kv.close().then(() => cc))
      .then((cc) => {
        if (cc) {
          if (Math.random() < 0.01) { // Simulate failure in 1% of purchases (expected).
            result.approved = 'false';
            result.failureReason = 'Credit card authorization failed';
          } else {
            result.approved = 'true';
            result.authorization = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
          }
        } else {
          result.approved = 'false';
          result.failureReason = 'No credit card supplied and no credit card stored in DB';
        }
        return result;
      })
      .then(res => callback(null, res))
      .catch(err => callback(err))

  }
};
