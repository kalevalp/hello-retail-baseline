'use strict';

const aws = require('aws-sdk'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

const constants = {
  STEP_FUNCTION: process.env.STEP_FUNCTION,
};

const stepfunctions = new aws.StepFunctions();

module.exports.handler = (event, context, callback) => {
  console.log(event);
  const params = {
    stateMachineArn: constants.STEP_FUNCTION,
    name: `${event.data.id}/${event.data.user}`,
    input: JSON.stringify(event.data),
  };
  stepfunctions.startExecution(params, (err) => {
    if (err) {
      if (err.code && err.code === 'ExecutionAlreadyExists') {
        callback()
      } else {
        callback(err)
      }
    } else {
      callback()
    }
  })
};

