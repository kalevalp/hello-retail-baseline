'use strict'

const AJV = require('ajv')
const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

// TODO Get these from a better place later
const productCreateSchema = require('./schemas/product-create-schema.json')

// TODO generalize this?  it is used by but not specific to this module
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const productCreateSchemaId = makeSchemaId(productCreateSchema)

const ajv = new AJV()
ajv.addSchema(productCreateSchema, productCreateSchemaId)

const constants = {
  INVALID_REQUEST: 'Invalid Request',
  INTEGRATION_ERROR: 'Kinesis Integration Error',
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

  clientError: (methodName, schemaId, ajvErrors, event) => impl.response(
    400,
    `${methodName} ${constants.INVALID_REQUEST} could not validate request to '${schemaId}' schema. Errors: '${ajvErrors}' found in event: '${JSON.stringify(event)}'`
  ),

  kinesisError: (methodName, err) => {
    console.log(err)
    return impl.response(500, `${methodName} - ${constants.INTEGRATION_ERROR}`)
  },

  success: items => impl.response(200, JSON.stringify(items)),

  validateAndWriteKinesisEventFromApiEndpoint(methodName, schema, schemaId, event, callback) {
    console.log(JSON.stringify(event))
    const eventData = JSON.parse(event.body)
    console.log(eventData)
    const origin = eventData.origin
    console.log(origin)
    delete eventData.origin

    if (!ajv.validate(schema, eventData)) { // bad request
      console.log(ajv.errorsText())
      callback(null, impl.clientError(methodName, schemaId, ajv.errorsText()), event)
    } else {
      const kinesis = new aws.Kinesis()
      const newEvent = {
        Data: JSON.stringify({
          schema: 'com.nordstrom/retail-stream-ingress/1-0-0',
          origin: origin,
          timeOrigin: new Date().toISOString(),
          data: eventData,
        }),
        PartitionKey: eventData.id,
        StreamName: process.env.STREAM_NAME,
      }

      kinesis.putRecord(newEvent, (err, data) => {
        if (err) {
          callback(null, impl.kinesisError(methodName, err))
        } else if (data) {
          callback(null, impl.success(`${methodName}: ${JSON.stringify(data)}`))
        }
      })
    }
  }
}

const api = {
  /**
   * Send the product created event to the retail event stream.  Example event:

   {
     "schema": "com.nordstrom/product/create/1-0-0",
     "id": "4579874",
     "merchant": "amzn1.application.0bfd7ce698a440a1ad215923053e1ec6",
     "brand": "POLO RALPH LAUREN",
     "name": "Polo Ralph Lauren 3-Pack Socks",
     "description": "PAGE:/s/polo-ralph-lauren-3-pack-socks/4579874",
     "category": "Socks for Men"
   }

   * @param event The API Gateway lambda invocation event describing the product to be created.
   * @param context AWS runtime related information, e.g. log group id, timeout, request id, etc.
   * @param callback The callback to inform of completion: (error, result).
   */
  productCreate: (event, context, callback) => {
    impl.validateAndWriteKinesisEventFromApiEndpoint('productCreate', productCreateSchema, productCreateSchemaId, event, callback);
  },
}

module.exports = {
  productCreate: api.productCreate,
}
