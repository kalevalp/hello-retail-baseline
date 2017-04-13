'use strict'

const AJV = require('ajv')
const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

/**
 * AJV
 */
// TODO Get these from a better place later
const eventSchema = require('./retail-stream-schema-ingress.json')
const updatePhoneSchema = require('./user-update-phone-schema.json')
const productCreateSchema = require('./product-create-schema.json')

// TODO generalize this?  it is used by but not specific to this module
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const eventSchemaId = makeSchemaId(eventSchema)
const updatePhoneSchemaId = makeSchemaId(updatePhoneSchema)
const productCreateSchemaId = makeSchemaId(productCreateSchema)

const ajv = new AJV()
ajv.addSchema(eventSchema, eventSchemaId)
ajv.addSchema(updatePhoneSchema, updatePhoneSchemaId)
ajv.addSchema(productCreateSchema, productCreateSchemaId)

/**
 * AWS
 */
const dynamo = new aws.DynamoDB.DocumentClient()
const stepfunctions = new aws.StepFunctions()

const constants = {
  // self
  MODULE: 'product-photos/0.processor/processor.js',
  // methods
  METHOD_START_EXECUTION: 'startExecution',
  METHOD_PROCESS_EVENT: 'processEvent',
  METHOD_PROCESS_KINESIS_EVENT: 'processKinesisEvent',
  // errors
  BAD_MSG: 'bad msg:',
  // values
  TTL_DELTA_IN_SECONDS: 60 /* seconds per minute */ * 60 /* minutes per hour */ * 2 /* hours */,
  // resources
  STEP_FUNCTION: process.env.STEP_FUNCTION,
  TABLE_PHOTO_REGISTRATIONS_NAME: process.env.TABLE_PHOTO_REGISTRATIONS_NAME,
}

const impl = {
  /**
   * Parse the origin
   * @param origin
   * @return {*}
   */
  eventSource: (origin) => {
    const parts = origin.split('/')
    if (parts.length > 2) {
      return {
        uniqueId: parts[2],
        friendlyName: parts.length === 3 ? parts[2] : parts[3],
      }
    } else if (parts.length === 2) {
      return {
        uniqueId: parts[1],
        friendlyName: parts[1],
      }
    } else {
      return {
        uniqueId: 'UNKNOWN',
        friendlyName: 'UNKNOWN',
      }
    }
  },
  /**
   * Handle the given photographer registration message.  The impact of photographer registration is the immediate
   * allocation of a 3 image allowance (up to) with a TTL of roughly 2 hours (may vary).
   * @param event The event declaring the photographer registration action.  Example event:
   * {
   *   "schema": "com.nordstrom/retail-stream/1-0-0",
   *   "origin": "hello-retail/photographer-registration-automation",
   *   "timeOrigin": "2017-01-12T18:29:25.171Z",
   *   "data": {
   *     "schema": "com.nordstrom/user-info/update-phone/1-0-0",
   *     "id": "4579874",
   *     "phone": "1234567890"
   *   }
   * }
   * @param complete The callback with which to report any errors
   */
  registerPhotographer: (event, complete) => {
    const updated = Date.now()
    const name = impl.eventSource(event.origin).friendlyName
    const putParams = {
      TableName: constants.TABLE_PHOTO_REGISTRATIONS_NAME,
      ConditionExpression: 'attribute_not_exists(id)',
      Item: {
        id: event.data.id,
        name,
        created: updated,
        createdBy: event.origin,
        updated,
        updatedBy: event.origin,
        phone: `+1${event.data.phone}`,
        lastEvent: event.eventId,
        registrations: 3,
        assignments: 0,
        timeToLive: Math.ceil(updated / 1000 /* milliseconds per second */) + constants.TTL_DELTA_IN_SECONDS,
      },
    }
    dynamo.put(putParams, (err) => {
      if (err) {
        if (err.code && err.code === 'ConditionalCheckFailedException') {
          const updateParams = {
            TableName: constants.TABLE_PHOTO_REGISTRATIONS_NAME,
            Key: {
              id: event.data.id, // TODO the right thing?
            },
            ConditionExpression: '#le<:le', // update if this event has not yet caused an update
            UpdateExpression: [
              'set',
              '#c=if_not_exists(#c,:c),',
              '#cb=if_not_exists(#cb,:cb),',
              '#u=:u,',
              '#ub=:ub,',
              '#le=:le,',
              '#re=#re+:re,',
              '#as=if_not_exists(#as,:as),',
              '#tt=:tt',
            ].join(' '),
            ExpressionAttributeNames: {
              '#c': 'created',
              '#cb': 'createdBy',
              '#u': 'updated',
              '#ub': 'updatedBy',
              '#le': 'lastEvent',
              '#re': 'registrations',
              '#as': 'assignments',
              '#tt': 'timeToLive', // TODO automated setup of TTL for table
            },
            ExpressionAttributeValues: {
              ':c': updated,
              ':cb': event.origin,
              ':u': updated,
              ':ub': event.origin,
              ':le': event.eventId, // TODO the right thing (this field is not currently available in event)
              ':re': 3,
              ':as': 0,
              ':tt': (Math.ceil(updated / 1000 /* milliseconds per second */) + constants.TTL_DELTA_IN_SECONDS).toString(),
            },
            ReturnValues: 'NONE',
            ReturnConsumedCapacity: 'NONE',
            ReturnItemCollectionMetrics: 'NONE',
          }
          dynamo.update(updateParams, complete)
        } else {
          complete(err)
        }
      } else {
        complete()
      }
    })
  },
  /**
   * Start and execution corresponding to the given event.  Swallow errors that result from attempting to
   * create the execution beyond the first time.
   * @param event The event to validate and process with the appropriate logic.  Example event:
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
   * @param complete The callback with which to report any errors
   */
  startExecution: (event, complete) => {
    const sfEvent = event
    sfEvent.merchantName = impl.eventSource(event.origin).friendlyName
    const params = {
      stateMachineArn: constants.STEP_FUNCTION,
      name: sfEvent.data.id,
      input: JSON.stringify(sfEvent),
    }
    stepfunctions.startExecution(params, (err) => {
      if (err) {
        if (err.code && err.code === 'ExecutionAlreadyExists') {
          complete()
        } else {
          complete(err)
        }
      } else {
        complete()
      }
    })
  },
  /**
   * Process the given event, reporting failure or success to the given callback.
   * @param event The event to validate and process with the appropriate logic.
   * @param complete The callback with which to report any errors
   */
  processEvent: (event, complete) => {
    if (!event || !event.schema) {
      complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} event or schema was not truthy.`)
    } else if (event.schema !== eventSchemaId) {
      complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} event did not have proper schema.  observed: '${event.schema}' expected: '${eventSchemaId}'`)
    } else if (!ajv.validate(eventSchemaId, event)) {
      complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} could not validate event to '${eventSchemaId}' schema.  Errors: ${ajv.errorsText()}, ${JSON.stringify(ajv.errors, null, 2)}`)
    } else if (event.data.schema === updatePhoneSchemaId) {
      if (!ajv.validate(updatePhoneSchemaId, event.data)) {
        complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} could not validate event to '${updatePhoneSchemaId}' schema. Errors: ${ajv.errorsText()}, ${JSON.stringify(ajv.errors, null, 2)}`)
      } else {
        impl.registerPhotographer(event, complete)
      }
    } else if (event.data.schema === productCreateSchemaId) {
      if (!ajv.validate(productCreateSchemaId, event.data)) {
        complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} could not validate event to '${productCreateSchemaId}' schema. Errors: ${ajv.errorsText()}, ${JSON.stringify(ajv.errors, null, 2)}`)
      } else {
        impl.startExecution(event, complete)
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
            const msg = `${constants.MODULE} ${err}`
            console.log(msg)
            if (msg.indexOf(`${constants.MODULE} ${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG}`) !== -1) {
              console.log('######################################################################################')
              console.log(msg)
              console.log('######################################################################################')
              successes += 1
            } else if (err.code && err.code === 'ConditionalCheckFailedException') {
              successes += 1 // this update has already occurred.  hooray!
            } else {
              throw new Error(msg)
            }
          } else {
            successes += 1
          }
          if (successes === kinesisEvent.Records.length) {
            console.log(`${constants.MODULE} ${constants.METHOD_PROCESS_KINESIS_EVENT} - all ${kinesisEvent.Records.length} events processed successfully.`)
            callback()
          }
        }
        for (let i = 0; i < kinesisEvent.Records.length; i++) {
          const record = kinesisEvent.Records[i]
          if (
            record.kinesis &&
            record.kinesis.data
          ) {
            let parsed
            try {
              const payload = new Buffer(record.kinesis.data, 'base64').toString()
              console.log(`${constants.MODULE} ${constants.METHOD_PROCESS_KINESIS_EVENT} - payload: ${payload}`) // TODO remove?
              parsed = JSON.parse(payload)
              parsed.eventId = record.eventID // TODO hack to be fixed by using stream syndication
            } catch (ex) {
              complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} failed to decode and parse the data - "${ex.stack}".`)
            }
            if (parsed) {
              impl.processEvent(parsed, complete)
            }
          } else {
            complete(`${constants.METHOD_PROCESS_EVENT} ${constants.BAD_MSG} record missing kinesis data.`)
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
