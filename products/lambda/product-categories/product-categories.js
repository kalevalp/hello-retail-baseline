'use strict';

const AWS = require('aws-sdk');

// TODO: Fully implement
exports.handler = (/* event, context, callback */) => {
  const dynamo = new AWS.DynamoDB();

  dynamo.config.credentials = new AWS.TemporaryCredentials({
    RoleArn: process.env.DYNAMO_READER_ROLE,
  });

  // console.log(JSON.stringify(dynamo.config.credentials,null,2));
};
