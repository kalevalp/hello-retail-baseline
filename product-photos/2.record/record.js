'use strict'

const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

const dynamo = new aws.DynamoDB.DocumentClient()
const stepfunctions = new aws.StepFunctions()

const constants = {
  MODULE: 'record.js',
  METHOD_PUT_ASSIGNMENT: 'putToken',

  RECEIVE_ACTIVITY_ARN: process.env.ACTIVITY_RECEIVE_ARN,
  TABLE_PHOTO_ASSIGNMENTS_NAME: process.env.TABLE_PHOTO_ASSIGNMENTS_NAME,
}

const impl = {
  getTask: (event, callback) => {
    const params = {
      activityArn: constants.RECEIVE_ACTIVITY_ARN,
    }
    stepfunctions.getActivityTask(params, callback)
  },
  failTask: (event, task, putErr, callback) => {
    const params = {
      taskToken: task.taskToken,
      cause: 'DynamoDb Failure',
      error: putErr,
    }
    stepfunctions.sendTaskFailure(params, callback)
  },
  putAssignment: (event, task, callback) => {
    const updated = Date.now()
    const dbParams = {
      TableName: constants.TABLE_PHOTO_ASSIGNMENTS_NAME,
      Key: {
        number: event.photographer.phone,
      },
      UpdateExpression: [
        'set',
        '#c=if_not_exists(#c,:c),',
        '#cb=if_not_exists(#cb,:cb),',
        '#u=:u,',
        '#ub=:ub,',
        '#tt=:tt,',
        '#te=:te,',
        '#st=:st',
      ].join(' '),
      ExpressionAttributeNames: {
        '#c': 'created',
        '#cb': 'createdBy',
        '#u': 'updated',
        '#ub': 'updatedBy',
        '#tt': 'taskToken',
        '#te': 'taskEvent',
        '#st': 'status',
      },
      ExpressionAttributeValues: {
        ':c': updated,
        ':cb': event.origin,
        ':u': updated,
        ':ub': event.origin,
        ':tt': task.taskToken,
        ':te': task.input,
        ':st': 'pending',
      },
      ReturnValues: 'NONE',
      ReturnConsumedCapacity: 'NONE',
      ReturnItemCollectionMetrics: 'NONE',
    }
    dynamo.update(dbParams, (err) => {
      if (err) {
        callback(`${constants.MODULE} ${constants.METHOD_PUT_ASSIGNMENT} - error updating DynamoDb: ${err}`)
      } else { // second update result if error was not previously seen
        callback()
      }
    })
  },
}

// Example event:
// {
//   schema: 'com.nordstrom/retail-stream/1-0-0',
//   origin: 'hello-retail/product-producer-automation',
//   timeOrigin: '2017-01-12T18:29:25.171Z',
//   data: {
//     schema: 'com.nordstrom/product/create/1-0-0',
//     id: 4579874,
//     brand: 'POLO RALPH LAUREN',
//     name: 'Polo Ralph Lauren 3-Pack Socks',
//     description: 'PAGE:/s/polo-ralph-lauren-3-pack-socks/4579874',
//     category: 'Socks for Men',
//   }
// }
exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event))

  impl.getTask(event, (getErr, task) => {
    if (getErr) {
      callback(getErr)
    } else {
      impl.putAssignment(event, task, (putErr) => {
        if (putErr) {
          impl.failTask(event, task, putErr, callback)
        } else {
          callback(null, event)
        }
      })
    }
  })
}
