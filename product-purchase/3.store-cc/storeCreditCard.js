'use strict';

const { KV_Store } = require('kv-store');
const fs = require('fs');

const conf = JSON.parse(fs.readFileSync('conf.json', 'utf8'));

const constants = {
  TABLE_CREDIT_CARDS_NAME: 'creditCardsTable',
};

module.exports.authenticate = (event, context, callback) => {
  let p;

  if (event.storeCC) {
    const kv = new KV_Store(conf.host, conf.user, conf.pass, constants.TABLE_CREDIT_CARDS_NAME);

    p = kv.init()
      .then(kv.put(event.user, event.creditCard))
      .then(() => kv.close())
  } else {
    p = Promise.resolve()
  }

  return p.then(() => callback(null, event))
    .catch(err => callback(err));
};
