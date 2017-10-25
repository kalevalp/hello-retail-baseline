'use strict';

module.exports.handler = (event, context, callback) => {
  const result = event;
  if (Math.random() < 0.01) { // Simulate failure in 1% of purchases (expected).
    result.approved = 'true';
  } else {
    result.approved = 'false';
    result.failureReason = 'Credit card authorization failed';
  }

  callback(null, result);
};
