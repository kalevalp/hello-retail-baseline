'use strict'

const AJV = require('ajv')
const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

// TODO Get these from a better place later
const productPurchaseSchema = require('./schemas/product-purchase-schema.json')

// TODO generalize this?  it is used by but not specific to this module
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const productPurchaseSchemaId = makeSchemaId(productPurchaseSchema)

const ajv = new AJV()
ajv.addSchema(productPurchaseSchema, productPurchaseSchemaId)

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
   * Send the product purchased event to the retail event stream.  Example event:

   {
     "schema": "com.nordstrom/product/purchase/1-0-0",
     "id": "4579874"
   }

   * @param event The API Gateway lambda invocation event describing the product to be purchased.
   * @param context AWS runtime related information, e.g. log group id, timeout, request id, etc.
   * @param callback The callback to inform of completion: (error, result).
   */
  productPurchase: (event, context, callback) => {
    impl.validateAndWriteKinesisEventFromApiEndpoint('productPurchase', productPurchaseSchema, productPurchaseSchemaId, event, callback);
  },
}

module.exports = {
  productPurchase: api.productPurchase,
}
