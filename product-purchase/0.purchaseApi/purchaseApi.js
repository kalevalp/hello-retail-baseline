'use strict';

const aws = require('aws-sdk'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

const constants = {
  STEP_FUNCTION: process.env.STEP_FUNCTION,
};

const stepfunctions = new aws.StepFunctions();

const util = {
  response: (statusCode, body) => ({
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body,
  }),
  success: response => util.response(200, JSON.stringify(response)),
}

module.exports.handler = (event, context, callback) => {
  console.log(event);
  const data = JSON.parse(event.body);

  const params = {
    stateMachineArn: constants.STEP_FUNCTION,
    name: `${data.user}--product-${data.id}--request-${data.requestId}`,
    input: JSON.stringify(data),
  };
  stepfunctions.startExecution(params, (err) => {
    if (err) {
      if (err.code && err.code === 'ExecutionAlreadyExists') {
        callback(util.success('Purchase has submitted previously. You will not be charged twice.'))
      } else {
        callback(err)
      }
    } else {
      callback(util.success('Purchase submitted. Thank you!'))
    }
  })
};

