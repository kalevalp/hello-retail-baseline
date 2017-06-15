'use strict'

const awsXRay = require('aws-xray-sdk')
const aws = awsXRay.captureAWS(require('aws-sdk')) // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

// TODO Make a dynamoDB in a service that holds all of the schema and a schema-getter and validator, instead of listing them out here
const AJV = require('ajv')

const ajv = new AJV()
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const productPurchaseSchema = require('./schemas/product-purchase-schema.json')
const productCreateSchema = require('./schemas/product-create-schema.json')
const userLoginSchema = require('./schemas/user-login-schema.json')
const updatePhoneSchema = require('./schemas/user-update-phone-schema.json')
const addRoleSchema = require('./schemas/user-add-role-schema.json')

const productPurchaseSchemaId = makeSchemaId(productPurchaseSchema)
const productCreateSchemaId = makeSchemaId(productCreateSchema)
const userLoginSchemaId = makeSchemaId(userLoginSchema)
const updatePhoneSchemaId = makeSchemaId(updatePhoneSchema)
const addRoleSchemaId = makeSchemaId(addRoleSchema)
ajv.addSchema(productPurchaseSchema, productPurchaseSchemaId)
ajv.addSchema(productCreateSchema, productCreateSchemaId)
ajv.addSchema(userLoginSchema, userLoginSchemaId)
ajv.addSchema(updatePhoneSchema, updatePhoneSchemaId)
ajv.addSchema(addRoleSchema, addRoleSchemaId)

const constants = {
  INVALID_REQUEST: 'Invalid Request: could not validate request to the schema provided.',
  INTEGRATION_ERROR: 'Kinesis Integration Error',
  API_NAME: 'Retail Stream Event Writer',
}

const impl = {
  response: (statusCode, body) => ({
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body,
  }),

  clientError: (error, event) => impl.response(400,
    `${constants.API_NAME} ${constants.INVALID_REQUEST}  ${error}.  Event: '${JSON.stringify(event)}'`),

  kinesisError: (schemaName, err) => {
    console.log(err)
    return impl.response(500, `${constants.API_NAME} - ${constants.INTEGRATION_ERROR} trying to write an event for '${JSON.stringify(schemaName)}'`)
  },

  success: response => impl.response(200, JSON.stringify(response)),

  validateAndWriteKinesisEventFromApiEndpoint(event, callback) {
    console.log(JSON.stringify(event))
    const eventData = JSON.parse(event.body)
    console.log(eventData)
    const origin = eventData.origin
    console.log(origin)
    delete eventData.origin

    if (!eventData.schema || typeof eventData.schema !== 'string') {
      callback(null, impl.clientError('Schema name is missing or not a string in received event.', event))
    } else {
      const schema = ajv.getSchema(eventData.schema)
      if (!schema) {
        callback(null, impl.clientError(`Schema name ${eventData.schema} is not registered.`, event))
      } else if (!ajv.validate(eventData.schema, eventData)) {
        callback(null, impl.clientError(`Could not validate event to the schema ${eventData.schema}.  Errors: ${ajv.errorsText()}`, event))
      } else {
        const kinesis = new aws.Kinesis()
        const newEvent = {
          Data: JSON.stringify({
            schema: 'com.nordstrom/retail-stream-ingress/1-0-0',
            timeOrigin: new Date().toISOString(),
            data: eventData,
            origin, // TODO mask any PII here
          }),
          PartitionKey: eventData.id, // TODO if some schema use id field something other than the partition key, the schema need to have a keyName field and here code should be eventData[eventData.keyName]
          StreamName: process.env.STREAM_NAME,
        }

        kinesis.putRecord(newEvent, (err, data) => {
          if (err) {
            callback(null, impl.kinesisError(eventData.schema, err))
          } else {
            callback(null, impl.success(data))
          }
        })
      }
    }
  },
}

const api = {
  /**
   * Send the retail event to the retail stream.  Example events:
   *
   * product-purchase:
   {
     "schema": "com.nordstrom/product/purchase/1-0-0",
     "id": "4579874"
   }
   *
   * product-create:
   {
     "schema": "com.nordstrom/product/create/1-0-0",
     "id": "4579874",
     "brand": "POLO RALPH LAUREN",
     "name": "Polo Ralph Lauren 3-Pack Socks",
     "description": "PAGE:/s/polo-ralph-lauren-3-pack-socks/4579874",
     "category": "Socks for Men"
   }
   *
   * user-login:
   {
     "schema": "com.nordstrom/user-info/create/1-0-0",
     "id": "amzn1.account.AHMNGKVGNQYJUV7BZZZMFH3HP3KQ",
     "name": "Greg Smith"
   }
   *
   * update-phone:
   {
     "schema": "com.nordstrom/user-info/create/1-0-0",
     "id": "amzn1.account.AHMNGKVGNQYJUV7BZZZMFH3HP3KQ",
     "phone": "4255552603"
   }
   *
   * @param event The API Gateway lambda invocation event describing the event to be written to the retail stream.
   * @param context AWS runtime related information, e.g. log group id, timeout, request id, etc.
   * @param callback The callback to inform of completion: (error, result).
   */
  eventWriter: (event, context, callback) => {
    impl.validateAndWriteKinesisEventFromApiEndpoint(event, callback)
  },
}

module.exports = {
  eventWriter: api.eventWriter,
}
