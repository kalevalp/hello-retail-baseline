'use strict'

const AJV = require('ajv')
const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

// TODO Get these from a better place later
const eventSchema = require('./retail-stream-schema-ingress.json')
const productCreateSchema = require('./product-create-schema.json')

// TODO generalize this?  it is used by but not specific to this module
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const eventSchemaId = makeSchemaId(eventSchema)
const productCreateSchemaId = makeSchemaId(productCreateSchema)

const ajv = new AJV()
ajv.addSchema(eventSchema, eventSchemaId)
ajv.addSchema(productCreateSchema, productCreateSchemaId)

const dynamo = new aws.DynamoDB.DocumentClient()

const constants = {
  // self
  MODULE: 'product-catalog/catalog.js',
  // methods
  METHOD_PUT_PRODUCT: 'putProduct',
  METHOD_PROCESS_EVENT: 'processEvent',
  METHOD_PROCESS_KINESIS_EVENT: 'processKinesisEvent',
  // errors
  BAD_MSG: 'bad msg:',
  // resources
  TABLE_PRODUCT_CATEGORY_NAME: process.env.TABLE_PRODUCT_CATEGORY_NAME,
  TABLE_PRODUCT_CATALOG_NAME: process.env.TABLE_PRODUCT_CATALOG_NAME,
}

const impl = {
  /**
   * Put the given product in to the dynamo catalog.  Example event:
   * {
   *   "schema": "com.nordstrom/retail-stream/1-0-0",
   *   "origin": "hello-retail/product-producer-automation",
   *   "timeOrigin": "2017-01-12T18:29:25.171Z",
   *   "data": {
   *     "schema": "com.nordstrom/product/create/1-0-0",
   *     "id": "4579874",
   *     "brand": "POLO RALPH LAUREN",
   *     "name": "Polo Ralph Lauren 3-Pack Socks",
   *     "description": "PAGE:/s/polo-ralph-lauren-3-pack-socks/4579874",
   *     "category": "Socks for Men"
   *   }
   * }
   * @param event The product to put in the catalog.
   * @param complete The callback to inform of completion, with optional error parameter.
   */
  putProduct: (event, complete) => {
    const updated = Date.now()
    let priorErr
    const updateCallback = (err) => {
      if (priorErr === undefined) { // first update result
        if (err) {
          priorErr = err
        } else {
          priorErr = false
        }
      } else if (priorErr && err) { // second update result, if an error was previously received and we have a new one
        complete(`${constants.METHOD_PUT_PRODUCT} - errors updating DynamoDb: ${[priorErr, err]}`)
      } else if (priorErr || err) {
        complete(`${constants.METHOD_PUT_PRODUCT} - error updating DynamoDb: ${priorErr || err}`)
      } else { // second update result if error was not previously seen
        complete()
      }
    }
    const dbParamsCategory = {
      TableName: constants.TABLE_PRODUCT_CATEGORY_NAME,
      Key: {
        category: event.data.category,
      },
      UpdateExpression: [
        'set',
        '#c=if_not_exists(#c,:c),',
        '#cb=if_not_exists(#cb,:cb),',
        '#u=:u,',
        '#ub=:ub',
      ].join(' '),
      ExpressionAttributeNames: {
        '#c': 'created',
        '#cb': 'createdBy',
        '#u': 'updated',
        '#ub': 'updatedBy',
      },
      ExpressionAttributeValues: {
        ':c': updated,
        ':cb': event.origin,
        ':u': updated,
        ':ub': event.origin,
      },
      ReturnValues: 'NONE',
      ReturnConsumedCapacity: 'NONE',
      ReturnItemCollectionMetrics: 'NONE',
    }
    dynamo.update(dbParamsCategory, updateCallback)
    const dbParamsProduct = {
      TableName: constants.TABLE_PRODUCT_CATALOG_NAME,
      Key: {
        id: event.data.id,
      },
      UpdateExpression: [
        'set',
        '#c=if_not_exists(#c,:c),',
        '#cb=if_not_exists(#cb,:cb),',
        '#u=:u,',
        '#ub=:ub,',
        '#b=:b,',
        '#n=:n,',
        '#d=:d,',
        '#cat=:cat',
      ].join(' '),
      ExpressionAttributeNames: {
        '#c': 'created',
        '#cb': 'createdBy',
        '#u': 'updated',
        '#ub': 'updatedBy',
        '#b': 'brand',
        '#n': 'name',
        '#d': 'description',
        '#cat': 'category',
      },
      ExpressionAttributeValues: {
        ':c': updated,
        ':cb': event.origin,
        ':u': updated,
        ':ub': event.origin,
        ':b': event.data.brand,
        ':n': event.data.name,
        ':d': event.data.description,
        ':cat': event.data.category,
      },
      ReturnValues: 'NONE',
      ReturnConsumedCapacity: 'NONE',
      ReturnItemCollectionMetrics: 'NONE',
    }
    dynamo.update(dbParamsProduct, updateCallback)
  },
  /**
   * Process the given event, reporting failure or success to the given callback
   * @param event The event to validate and process with the appropriate logic
   * @param complete The callback with which to report any errors
   */
  processEvent: (event, complete) => {
    if (!event || !event.schema) {
      complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} event or schema was not truthy.`)
    } else if (event.schema !== eventSchemaId) {
      complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} event did not have proper schema.  observed: '${event.schema}' expected: '${eventSchemaId}'`)
    } else if (!ajv.validate(eventSchemaId, event)) {
      complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} could not validate event to '${eventSchemaId}' schema.  Errors: ${ajv.errorsText()}`)
    } else if (event.data.schema === productCreateSchemaId) {
      if (!ajv.validate(productCreateSchemaId, event.data)) {
        complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} could not validate event to '${productCreateSchema}' schema. Errors: ${ajv.errorsText()}`)
      } else {
        impl.putProduct(event, complete)
      }
    } else {
      // TODO remove console.log and pass the above message once we are only receiving subscribed events
      console.log(`${constants.MODULE} ${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} - event with unsupported schema (${event.data.schema}) observed.`)
      complete()
    }
  },
}

module.exports = {
  /**
   * Example Kinesis Event:
   * {
   *   "Records": [
   *     {
   *       "kinesis": {
   *         "kinesisSchemaVersion": "1.0",
   *         "partitionKey": "undefined",
   *         "sequenceNumber": "49568749374218235080373793662003016116473266703358230578",
   *         "data": "eyJzY2hlbWEiOiJjb20ubm9yZHN0cm9tL3JldGFpb[...]Y3NDQiLCJjYXRlZ29yeSI6IlN3ZWF0ZXJzIGZvciBNZW4ifX0=",
   *         "approximateArrivalTimestamp": 1484245766.362
   *       },
   *       "eventSource": "aws:kinesis",
   *       "eventVersion": "1.0",
   *       "eventID": "shardId-000000000003:49568749374218235080373793662003016116473266703358230578",
   *       "eventName": "aws:kinesis:record",
   *       "invokeIdentityArn": "arn:aws:iam::515126931066:role/devProductCatalogReaderWriter",
   *       "awsRegion": "us-west-2",
   *       "eventSourceARN": "arn:aws:kinesis:us-west-2:515126931066:stream/devRetailStream"
   *     },
   *     {
   *       "kinesis": {
   *         "kinesisSchemaVersion": "1.0",
   *         "partitionKey": "undefined",
   *         "sequenceNumber": "49568749374218235080373793662021150003767486140978823218",
   *         "data": "eyJzY2hlbWEiOiJjb20ubm9yZHN0cm9tL3JldGFpb[...]I3MyIsImNhdGVnb3J5IjoiU3dlYXRlcnMgZm9yIE1lbiJ9fQ==",
   *         "approximateArrivalTimestamp": 1484245766.739
   *       },
   *       "eventSource": "aws:kinesis",
   *       "eventVersion": "1.0",
   *       "eventID": "shardId-000000000003:49568749374218235080373793662021150003767486140978823218",
   *       "eventName": "aws:kinesis:record",
   *       "invokeIdentityArn": "arn:aws:iam::515126931066:role/devProductCatalogReaderWriter",
   *       "awsRegion": "us-west-2",
   *       "eventSourceARN": "arn:aws:kinesis:us-west-2:515126931066:stream/devRetailStream"
   *     }
   *   ]
   * }
   * @param kinesisEvent The Kinesis event to decode and process.
   * @param context The Lambda context object.
   * @param callback The callback with which to call with results of event processing.
   */
  processKinesisEvent: (kinesisEvent, context, callback) => {
    try {
      console.log(`${constants.MODULE} ${constants.METHOD_PROCESS_KINESIS_EVENT} - kinesis event received: ${JSON.stringify(kinesisEvent, null, 2)}`)
      if (
        kinesisEvent &&
        kinesisEvent.Records &&
        Array.isArray(kinesisEvent.Records)
      ) {
        let successes = 0
        const complete = (err) => {
          if (err) {
            // TODO uncomment following
            // throw new Error(`${constants.MODULE} ${err}`);
            // TODO remove rest of block to use above.
            const msg = `${constants.MODULE} ${err}`
            if (err.indexOf(`${constants.MODULE} ${constants.METHOD_PROCESS_EVENT}  ${constants.BAD_MSG}`) !== -1) {
              console.log('######################################################################################')
              console.log(msg)
              console.log('######################################################################################')
              successes += 1
            } else {
              throw new Error(msg)
            }
          } else {
            successes += 1
            if (successes === kinesisEvent.Records.length) {
              console.log(`${constants.MODULE} ${constants.METHOD_PROCESS_KINESIS_EVENT} - all ${kinesisEvent.Records.length} events processed successfully.`)
              callback(null, true)
            }
          }
        }
        for (let i = 0; i < kinesisEvent.Records.length; i++) {
          const record = kinesisEvent.Records[i]
          if (
            record.kinesis &&
            record.kinesis.data
          ) {
            const payload = new Buffer(record.kinesis.data, 'base64').toString('ascii')
            console.log(`${constants.MODULE} ${constants.METHOD_PROCESS_KINESIS_EVENT} - payload: ${payload}`)
            impl.processEvent(JSON.parse(payload), complete)
          }
        }
      } else {
        callback(`${constants.MODULE} ${constants.METHOD_PROCESS_KINESIS_EVENT} - no records received.`)
      }
    } catch (ex) {
      console.log(`${constants.MODULE} ${constants.METHOD_PROCESS_KINESIS_EVENT} - exception: ${ex.stack}`)
      callback(ex)
    }
  },
}

console.log(`${constants.MODULE} - CONST: ${JSON.stringify(constants, null, 2)}`)
console.log(`${constants.MODULE} - ENV:   ${JSON.stringify(process.env, null, 2)}`)
