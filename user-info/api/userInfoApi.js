'use strict'

const AJV = require('ajv')
const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

// TODO Get these from a better place later
const userLoginSchema = require('./schemas/user-login-schema.json')
const updatePhoneSchema = require('./schemas/user-update-phone-schema.json')
const addRoleSchema = require('./schemas/user-add-role-schema.json')
const userInfoSchema = require('./schemas/user-info-schema.json')

// TODO generalize this?  it is used by but not specific to this module
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const userLoginSchemaId = makeSchemaId(userLoginSchema)
const updatePhoneSchemaId = makeSchemaId(updatePhoneSchema)
const addRoleSchemaId = makeSchemaId(addRoleSchema)
const userInfoSchemaId = makeSchemaId(userInfoSchema)

const ajv = new AJV()
ajv.addSchema(userLoginSchema, userLoginSchemaId)
ajv.addSchema(updatePhoneSchema, updatePhoneSchemaId)
ajv.addSchema(addRoleSchema, addRoleSchemaId)
ajv.addSchema(userInfoSchema, userInfoSchemaId)

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

    if (!ajv.validate(schema, eventData)) { // bad request
      console.log(ajv.errorsText())
      callback(null, impl.clientError(methodName, schemaId, ajv.errorsText()), event)
    } else {
      const kinesis = new aws.Kinesis()
      const newEvent = {
        Data: JSON.stringify({
          schema: 'com.nordstrom/retail-stream-ingress/1-0-0',
          origin: 'hello-retail/user-info-api',  // TODO: fix hard-coded app name
          timeOrigin: new Date().toISOString(),
          data: event.body,
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
   * Send the user login event to the retail event stream.  Example event:

   {
     "schema": "com.nordstrom/user-info/create/1-0-0",
     "id": "amzn1.account.AHMNGKVGNQYJUV7BZZZMFH3HP3KQ",
     "name": "Greg Smith"
   }

   * @param event The API Gateway lambda invocation event containing the info for the logged in user.
   * @param context AWS runtime related information, e.g. log group id, timeout, request id, etc.
   * @param callback The callback to inform of completion: (error, result).
   */
  loginUser: (event, context, callback) => {
    impl.validateAndWriteKinesisEventFromApiEndpoint('loginUser', userLoginSchema, userLoginSchemaId, event, callback);
  },

  /**
   * Send the user phone number updated event to the retail event stream.  Example event:

   {
     "schema": "com.nordstrom/user-info/create/1-0-0",
     "id": "amzn1.account.AHMNGKVGNQYJUV7BZZZMFH3HP3KQ",
     "phone": "4255552603"
   }

   * @param event The API Gateway lambda invocation event containing the user's new phone.
   * @param context AWS runtime related information, e.g. log group id, timeout, request id, etc.
   * @param callback The callback to inform of completion: (error, result).
   */
  updatePhone: (event, context, callback) => {
    impl.validateAndWriteKinesisEventFromApiEndpoint('updatePhone', updatePhoneSchema, updatePhoneSchemaId, event, callback);
  },

  /**
   * Send the user phone number updated event to the retail event stream.  Example event:

   {
     "schema": "com.nordstrom/user-info/create/1-0-0",
     "id": "amzn1.account.AHMNGKVGNQYJUV7BZZZMFH3HP3KQ",
     "role": "merchant"
   }

   * @param event The API Gateway lambda invocation event containing the role for the user.
   * @param context AWS runtime related information, e.g. log group id, timeout, request id, etc.
   * @param callback The callback to inform of completion: (error, result).
   */
  addRole: (event, context, callback) => {
    impl.validateAndWriteKinesisEventFromApiEndpoint('addRole', addRoleSchema, addRoleSchemaId, event, callback);
  },
}

module.exports = {
  loginUser: api.loginUser,
  updatePhone: api.updatePhone,
  addRole: api.addRole,
}
