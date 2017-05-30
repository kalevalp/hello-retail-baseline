'use strict'

const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

const dynamo = new aws.DynamoDB.DocumentClient()

const constants = {
  // self
  MODULE: 'product-photos/4.fail/fail.js',
  METHOD_UPDATE_ASSIGNMENT: 'updateAssignment',
  METHOD_HANDLER: 'handler',
  // External Values
  TABLE_PHOTO_ASSIGNMENTS_NAME: process.env.TABLE_PHOTO_ASSIGNMENTS_NAME,
}

const impl = {
  /**
   * Update the assignment associated with the given event.  It should be in the pending state.  If it is not,
   * then another component of the system changed it first and preempted this failure.  Accept that.  Otherwise,
   * the failure has been enacted.  Proceed accordingly.
   * @param event Example event:
   * {
   *   schema: 'com.nordstrom/retail-stream/1-0-0',
   *   origin: 'hello-retail/product-producer-automation',
   *   timeOrigin: '2017-01-12T18:29:25.171Z',
   *   data: {
   *     schema: 'com.nordstrom/product/create/1-0-0',
   *     id: 4579874,
   *     brand: 'POLO RALPH LAUREN',
   *     name: 'Polo Ralph Lauren 3-Pack Socks',
   *     description: 'PAGE:/s/polo-ralph-lauren-3-pack-socks/4579874',
   *     category: 'Socks for Men',
   *   },
   *   photographers: ['Erik'],
   *   photographer: {
   *     name: 'Erik',
   *     phone: '+<num>',
   *   },
   * }
   */
  deleteAssignment: (event, callback) => {
    const params = {
      TableName: constants.TABLE_PHOTO_ASSIGNMENTS_NAME,
      Key: {
        number: event.photographer.phone,
      },
      ConditionExpression: 'attribute_exists(#nu)',
      ExpressionAttributeNames: {
        '#nu': 'number', // status
      },
    }
    dynamo.delete(params, (err) => {
      if (err) {
        if (err.code && err.code === 'ConditionalCheckFailedException') { // consider the deletion of the record to indicate preemption by another component
          callback(null, event)
        } else {
          callback(err)
        }
      } else {
        callback(null, event)
      }
    })
  },
}

/**
 * Handle the failure of the process to obtain a photograph from a photographer
 * @param event The event indicating the context of the failed assignment
 * Example event:
 * {
 *   schema: 'com.nordstrom/retail-stream/1-0-0',
 *   origin: 'hello-retail/product-producer-automation',
 *   timeOrigin: '2017-01-12T18:29:25.171Z',
 *   data: {
 *     schema: 'com.nordstrom/product/create/1-0-0',
 *     id: 4579874,
 *     brand: 'POLO RALPH LAUREN',
 *     name: 'Polo Ralph Lauren 3-Pack Socks',
 *     description: 'PAGE:/s/polo-ralph-lauren-3-pack-socks/4579874',
 *     category: 'Socks for Men',
 *   }
 *   photographers: ['Erik'],
 *   photographer: {
 *     name: 'Erik',
 *     phone: '+<num>',
 *   },
 * }
 * @param context see Lambda docs
 * @param callback see Lambda docs
 */
exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event))

  impl.deleteAssignment(event, callback)
}

