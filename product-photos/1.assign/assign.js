'use strict'

const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies
const Promise = require('bluebird')

Promise.config({
  longStackTraces: true,
})

const dynamo = new aws.DynamoDB.DocumentClient()

/**
 * acquire photo states:
 *  executing assignment
 *  awaiting photo (paused)
 *  awaiting photographer (paused)
 * cases:
 *  no photographers registered/with remaining assignments.
 *  no photographers available.
 *  photographer available.
 *
 *  no pending photos
 *  photos pending
 */

const constants = {
  MODULE: 'assign.js',
  ERROR_SERVER: 'ServerError',
  // resources
  TABLE_PHOTO_REGISTRATIONS_NAME: process.env.TABLE_PHOTO_REGISTRATIONS_NAME,
}

/**
 * Errors
 */
class ServerError extends Error {
  constructor(message) {
    super(message)
    this.name = constants.ERROR_SERVER
  }
}

const impl = {
  queryPhotographersParams: (assignmentCount, priorData) => {
    const params = {
      TableName: constants.TABLE_PHOTO_REGISTRATIONS_NAME,
      IndexName: 'Assignments',
      KeyConditionExpression: '#as = :as',
      ExpressionAttributeNames: {
        '#as': 'assignments',
      },
      ExpressionAttributeValues: {
        ':as': assignmentCount,
      },
    }
    if (priorData && priorData.LastEvaluatedKey) {
      params.LastEvaluatedKey = priorData.LastEvaluatedKey
    }
    return params
  },
  updatePhotographerParams: (event, photographer) => {
    const updated = Date.now()
    return {
      TableName: constants.TABLE_PHOTO_REGISTRATIONS_NAME,
      Key: {
        id: photographer.id,
      },
      ConditionExpression: 'attribute_not_exists(#aa)',
      UpdateExpression: [
        'set',
        '#u=:u,',
        '#ub=:ub,',
        '#aa=:aa',
      ].join(' '),
      ExpressionAttributeNames: {
        '#u': 'updated',
        '#ub': 'updatedBy',
        '#aa': 'assignment',
      },
      ExpressionAttributeValues: {
        ':u': updated,
        ':ub': event.origin,
        ':aa': event.data.id.toString(),
      },
      ReturnValues: 'NONE',
      ReturnConsumedCapacity: 'NONE',
      ReturnItemCollectionMetrics: 'NONE',
    }
  },
  queryAndAssignPhotographersByAssignmentCount: Promise.coroutine(function* qP(event, assignmentCount, priorData) {
    const queryParams = impl.queryPhotographersParams(assignmentCount, priorData)
    const data = yield dynamo.query(queryParams).promise()
    console.log(`query result: ${JSON.stringify(data, null, 2)}`)
    if (data && data.Items && Array.isArray(data.Items) && data.Items.length) { // given a non-empty set of photographers, attempt assignment on the seemingly available ones
      for (let i = 0; i < data.Items.length; i++) {
        const item = data.Items[i]
        console.log(JSON.stringify(item, null, 2))
        if ( // is the current photographer assignable?
          !item.assignment && // not assigned
          'assignments' in item && Number.isInteger(item.assignments) && // valid assignments attribute
          'registrations' in item && Number.isInteger(item.registrations) && // valid registrations attribute
          item.assignments < item.registrations // fewer successful assignments than registrations
        ) {
          const updateParams = impl.updatePhotographerParams(event, item)
          const updateData = yield dynamo.update(updateParams).promise()
            .then(
              () => Promise.resolve(true),
              (err) => {
                if (err.code && err.code === 'ConditionalCheckFailedException') { // don't fail, another claimant obtained the photographer since we queried above
                  return Promise.resolve()
                } else {
                  return Promise.reject(new ServerError(err))
                }
              } // eslint-disable-line comma-dangle
            )
          console.log(`update result: ${JSON.stringify(updateData, null, 2)}`)
          if (updateData) {
            return Promise.resolve(item)
          }
        } // if not, proceed with any remaining photographers until none are left
      }
      if (data.LastEvaluatedKey) { // if there are more photographers with the given assignment count, continue
        return impl.queryAndAssignPhotographersByAssignmentCount(event, assignmentCount, data)
      }
    }
    // if no photographers were found and/or none was assigned... resolve undefined to indicate one could not be found
    // for the given assignment count
    return Promise.resolve()
  }),
  assignPhotographers: Promise.coroutine(function* aP(event) {
    let photographer
    for (let i = 0; i < 30; i++) {
      photographer = yield impl.queryAndAssignPhotographersByAssignmentCount(event, i)
      console.log(`queryPhotographers[${i}] result: ${JSON.stringify(photographer, null, 2)}`)
      if (photographer) {
        break // early exit, we found one
      }
    }
    return Promise.resolve(photographer)
  }),
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

  const result = event

  if (!result.photographers || !Array.isArray(result.photographers)) {
    result.photographers = []
  }
  impl.assignPhotographers(result)
    .then((photographer) => {
      result.photographer = photographer
      if (result.photographer) {
        result.photographers.push(result.photographer.id)
        result.assigned = 'true'
        result.assignmentComplete = 'false'
      } else {
        result.assigned = 'false'
      }
      callback(null, result)
    })
    .catch((ex) => {
      console.log(`${constants.MODULE} - Unexpected exception: ${ex.stack}`)
      callback(ex)
    })
}
