'use strict';

const aws = require('aws-sdk'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

// const { KV_Store } = require('kv-store');
// const fs = require('fs');
//
// const conf = JSON.parse(fs.readFileSync('conf.json', 'utf8'));

/**
 * AWS
 */
const kinesis = new aws.Kinesis();

const constants = {
  RETAIL_STREAM_NAME: ;
}

module.exports = {
  handler: (event, context, callback) => {
    const params = {
      PartitionKey: event.user,
      StreamName: constants.RETAIL_STREAM_NAME,
    };

    if (event.approved) {
      const purchaseEvent = {
        productId: event.id,
        productPrice: event.price,
        userId: event.user,
        authorization: event.authorization,
      };
      params.Data = JSON.stringify(purchaseEvent);

      kinesis.putRecord(params, callback);
    } else {
      params.Data = `Failed to purchase product. Reason: ${event.failureReason}`
    }
    return callback();
  },
};

