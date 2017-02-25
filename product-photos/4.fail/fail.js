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
  updateAssignment: (event, callback) => {
    const result = event
    const updated = Date.now()
    const dbParams = {
      TableName: constants.TABLE_PHOTO_ASSIGNMENTS_NAME,
      Key: {
        number: result.photographer.phone,
      },
      ConditionExpression: '#st=:es',
      UpdateExpression: [
        'set',
        '#u=:u,',
        '#ub=:ub,',
        '#st=:st',
        'remove',
        '#tt,',
        '#te',
      ].join(' '),
      ExpressionAttributeNames: {
        '#u': 'updated',
        '#ub': 'updatedBy',
        '#tt': 'taskToken',
        '#te': 'taskEvent',
        '#st': 'status',
      },
      ExpressionAttributeValues: {
        ':u': updated,
        ':ub': result.origin, // TODO something better?  Nice to have origin of this change but could inidcate system actor
        ':st': 'failed',
        ':es': 'pending', // expected status
      },
      ReturnValues: 'NONE',
      ReturnConsumedCapacity: 'NONE',
      ReturnItemCollectionMetrics: 'NONE',
    }
    // fail the assignment:
    // 1. Attempt to transition the task state to failed, using a conditional update
    // 2.
    //    a) If update fails, accept it, an image was received prior to failing
    //    b) If it succeeds, clear the photographer assignment in the event and proceed
    //      (this will be interpreted as a need to return to the assign state)
    dynamo.update(dbParams, (err) => {
      if (err) {
        if (err.code && err.code === 'ConditionalCheckFailedException') { // we failed to update due to the condition
          // This should never happen!  It is expected/assumed that the resolution of the activity is atomic.
          console.log('###########################################################################')
          console.log('###########################################################################')
          console.log(`Unexpected Failure of Conditional Update:\n${JSON.stringify(err, null, 2)}`)
          console.log('###########################################################################')
          console.log('###########################################################################')
          result.success = 'true' // since we failed to fail, we signal success (assuming this is the flow forwarding the state engine's execution)  Again, this shouldn't happen.
          callback(null, result)
        } else { // fail this state, so that it is rerun to deal with the error.
          callback(`${constants.MODULE} ${constants.METHOD_UPDATE_ASSIGNMENT} - error updating DynamoDb: ${err}`)
        }
      } else { // successfully marked the assignment as failed
        callback(null, result) // succeed this state, indicating the assignment failed (a new assignment will be made)
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

  impl.updateAssignment(event, callback)
}

