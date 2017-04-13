'use strict'

const AJV = require('ajv')
const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

/**
 * Constants
 */
const constants = {
  // self
  MODULE: 'product-photos/6.report/report.js',
  METHOD_: '',
  METHOD_WRITE_TO_STREAM: 'writeToStream',
  METHOD_SUCCEED_ASSIGNMENT: 'succeedAssignment',
  METHOD_DELETE_ASSIGNMENT: 'deleteAssignment',
  // external
  RETAIL_STREAM_NAME: process.env.RETAIL_STREAM_NAME,
  RETAIL_STREAM_WRITER_ARN: process.env.RETAIL_STREAM_WRITER_ARN,
  TABLE_PHOTO_REGISTRATIONS_NAME: process.env.TABLE_PHOTO_REGISTRATIONS_NAME,
  TABLE_PHOTO_ASSIGNMENTS_NAME: process.env.TABLE_PHOTO_ASSIGNMENTS_NAME,
}

/**
 * AJV
 */
// TODO Get these from a better place later
const eventSchema = require('./retail-stream-schema-ingress.json')
const productImageSchema = require('./product-image-schema.json')

// TODO generalize this?  it is used by but not specific to this module
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const eventSchemaId = makeSchemaId(eventSchema)
const productImageSchemaId = makeSchemaId(productImageSchema)

const ajv = new AJV()
ajv.addSchema(eventSchema, eventSchemaId)
ajv.addSchema(productImageSchema, productImageSchemaId)

/**
 * AWS
 */
const dynamo = new aws.DynamoDB.DocumentClient()
const kinesis = new aws.Kinesis()

/**
 * Implementation
 */
const impl = {
  writeToStream: (lambdaEvent, callback) => {
    const origin = `product-photos/Photographer/${lambdaEvent.photographer.phone}/${lambdaEvent.photographer.name}`
    const productId = lambdaEvent.data.id.toString()
    const imageEvent = {
      schema: eventSchemaId,
      origin,
      timeOrigin: new Date().toISOString(),
      data: {
        schema: productImageSchemaId,
        id: productId,
        image: lambdaEvent.image,
      },
    }
    if (!ajv.validate(eventSchemaId, imageEvent)) {
      callback(`failure to validate to '${eventSchemaId}' with event:\n${imageEvent}`)
    } else if (!ajv.validate(productImageSchemaId, imageEvent.data)) {
      callback(`failure to validate to '${productImageSchemaId}' with event data:\n${imageEvent.data}`)
    } else {
      const params = {
        Data: JSON.stringify(imageEvent),
        PartitionKey: productId,
        StreamName: constants.RETAIL_STREAM_NAME,
      }
      kinesis.putRecord(params, callback)
    }
  },
  succeedAssignment: (event, callback) => {
    const updated = Date.now()
    const params = {
      TableName: constants.TABLE_PHOTO_REGISTRATIONS_NAME,
      Key: {
        id: event.photographer.id,
      },
      ConditionExpression: '#aa=:aa',
      UpdateExpression: [
        'set',
        '#u=:u,',
        '#ub=:ub,',
        '#as=#as+:as',
        'remove',
        '#aa',
      ].join(' '),
      ExpressionAttributeNames: {
        '#u': 'updated',
        '#ub': 'updatedBy',
        '#as': 'assignments',
        '#aa': 'assignment',
      },
      ExpressionAttributeValues: {
        ':u': updated,
        ':ub': event.origin,
        ':as': 1,
        ':aa': event.data.id.toString(),
      },
      ReturnValues: 'NONE',
      ReturnConsumedCapacity: 'NONE',
      ReturnItemCollectionMetrics: 'NONE',
    }
    dynamo.update(params, callback)
  },
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
          callback()
        } else {
          callback(err)
        }
      } else {
        callback()
      }
    })
  },
}

module.exports = {
  /**
   * Handle the report stage of the Acquire Photo Step Function
   *    1. Report the photo to the stream
   *    2. Delete the pending assignment
   * Example Event:
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
   *   image: 'erik.hello-retail.biz/i/p/4579874'
   * }
   */
  handler: (event, context, callback) => {
    console.log(JSON.stringify(event))

    impl.writeToStream(event, (wErr) => {
      if (wErr) {
        callback(`${constants.MODULE} ${constants.METHOD_WRITE_TO_STREAM} - ${wErr.stack}`)
      } else {
        impl.succeedAssignment(event, (sErr) => {
          if (sErr && !(sErr.code && sErr.code === 'ConditionalCheckFailedException')) { // if we fail due to the conditional check, we should proceed regardless to remain idempotent
            callback(`${constants.MODULE} ${constants.METHOD_SUCCEED_ASSIGNMENT} - ${sErr.stack}`)
          } else {
            impl.deleteAssignment(event, (dErr) => {
              if (dErr) {
                callback(`${constants.MODULE} ${constants.METHOD_DELETE_ASSIGNMENT} - ${dErr.stack}`)
              } else {
                const result = event
                result.outcome = 'photo taken'
                callback(null, result)
              }
            })
          }
        })
      }
    })
  },
}
