'use strict'

const AJV = require('ajv')
const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies
const BbPromise = require('bluebird')
const got = require('got')
const Twilio = require('twilio')
const url = require('url')

/**
 * AJV
 */
// TODO Get these from a better place later
const twilioRequestSchema = require('./twilio-request-schema.json')
const photoAssignmentSchema = require('./photo-assignment-schema.json')

// TODO generalize this?  it is used by but not specific to this module
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const twilioRequestSchemaId = makeSchemaId(twilioRequestSchema)
const photoAssignmentSchemaId = makeSchemaId(photoAssignmentSchema)


const ajv = new AJV()
ajv.addSchema(twilioRequestSchema, twilioRequestSchemaId)
ajv.addSchema(photoAssignmentSchema, photoAssignmentSchemaId)

/**
 * AWS
 */
aws.config.setPromisesDependency(BbPromise)
const dynamo = new aws.DynamoDB.DocumentClient()
const kms = new aws.KMS()
const s3 = new aws.S3()
const stepfunctions = new aws.StepFunctions()

/**
 * Twilio
 */
const twilio = {
  authToken: undefined,
}

/**
 * Constants
 */
const constants = {
  // Errors
  ERROR_CLIENT: 'ClientError',
  ERROR_UNAUTHORIZED: 'Unauthorized',
  ERROR_USER: 'UserError',
  ERROR_SERVER: 'ServerError',
  ERROR_DATA_CORRUPTION: 'DATA CORRUPTION',
  ERROR_SECURITY_RISK: '!!!SECURITY RISK!!!',
  HASHES: '##########################################################################################',

  // Locations
  MODULE: 'receive.js',
  METHOD_HANDLER: 'handler',
  METHOD_DECRYPT: 'util.decrypt',
  METHOD_VALIDATE_TWILIO_REQUEST: 'impl.validateTwilioRequest',
  METHOD_GET_IMAGE_FROM_TWILIO: 'impl.getImageFromTwilio',
  METHOD_PLACE_IMAGE_IN_S3: 'impl.storeImage',
  METHOD_SEND_STEP_SUCCESS: 'impl.sendStepSuccess',

  // External
  ENDPOINT: process.env.ENDPOINT,
  IMAGE_BUCKET: process.env.IMAGE_BUCKET,
  TABLE_PHOTO_ASSIGNMENTS_NAME: process.env.TABLE_PHOTO_ASSIGNMENTS_NAME,
  TWILIO_AUTH_TOKEN_ENCRYPTED: process.env.TWILIO_AUTH_TOKEN_ENCRYPTED,
}

/**
 * Errors
 */
class ClientError extends Error {
  constructor(message) {
    super(message)
    this.name = constants.ERROR_CLIENT
  }
}
class AuthError extends Error {
  constructor(message) {
    super(message)
    this.name = constants.ERROR_UNAUTHORIZED
  }
}
class UserError extends Error {
  constructor(message) {
    super(message)
    this.name = constants.ERROR_USER
  }
}
class ServerError extends Error {
  constructor(message) {
    super(message)
    this.name = constants.ERROR_SERVER
  }
}

/**
 * Utility Methods (Internal)
 */
const util = {
  response: (statusCode, body) => ({
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body,
  }),
  securityRisk: (schemaId, ajvErrors, items) => {
    console.log(constants.HASHES)
    console.log(constants.ERROR_SECURITY_RISK)
    console.log(`${constants.METHOD_TODO} ${constants.ERROR_DATA_CORRUPTION} could not validate data to '${schemaId}' schema. Errors: ${ajvErrors}`)
    console.log(`${constants.METHOD_TODO} ${constants.ERROR_DATA_CORRUPTION} bad data: ${JSON.stringify(items)}`)
    console.log(constants.HASHES)
    return util.response(500, constants.ERROR_SERVER)
  },
  decrypt: (field, value) => kms.decrypt({ CiphertextBlob: new Buffer(value, 'base64') }).promise().then(
    data => BbPromise.resolve(data.Plaintext.toString('ascii')),
    err => BbPromise.reject(new ServerError(`Error decrypting '${field}': ${err}`)) // eslint-disable-line comma-dangle
  ),
}

/**
 * Implementation (Internal)
 */
const impl = {
  /**
   * Validate that the given event validates against the request schema
   * @param event The event representing the HTTPS request from Twilio (SMS sent notification)
   */
  validateApiGatewayRequest: (event) => {
    if (!ajv.validate(twilioRequestSchemaId, event)) { // bad request
      return BbPromise.reject(new ClientError(`could not validate request to '${twilioRequestSchemaId}' schema. Errors: '${ajv.errorsText()}' found in event: '${JSON.stringify(event)}'`))
    } else {
      return BbPromise.resolve(event)
    }
  },
  /**
   * Ensure that we have decrypted the Twilio credentials and initialized the SDK with them
   * @param event The event representing the HTTPS request from Twilio (SMS sent notification)
   */
  ensureAuthTokenDecrypted: (event) => {
    if (!twilio.authToken) {
      return util.decrypt('authToken', constants.TWILIO_AUTH_TOKEN_ENCRYPTED)
        .then((authToken) => {
          twilio.authToken = authToken
          return BbPromise.resolve(event)
        })
    } else {
      return BbPromise.resolve(event)
    }
  },
  /**
   * Validate the request as having a proper signature from Twilio.  This provides authentication that the request came from Twillio.
   * @param event The event representing the HTTPS request from Twilio (SMS sent notification)
   */
  validateTwilioRequest: (event) => {
    const body = url.parse(`?${event.body}`, true).query
    if (!Twilio.validateRequest(twilio.authToken, event.headers['X-Twilio-Signature'], constants.ENDPOINT, body)) {
      return BbPromise.reject(new AuthError('Twilio message signature validation failure!'))
    } else if (body.NumMedia < 1) {
      return BbPromise.reject(new UserError('Oops!  We were expecting a product image.  Please send one!  :D'))
    } else if (body.NumMedia < 1) {
      return BbPromise.reject(new UserError('Oops!  We can only handle one image.  Sorry... can you please try again?  :D'))
    } else if (!body.MediaContentType0 || !body.MediaContentType0.startsWith('image/')) {
      return BbPromise.reject(new UserError('Oops!  We can only accept standard images.  We weren\'t very creative...'))
    } else if (!body.From) {
      return BbPromise.reject(new ServerError('Request from Twilio did not contain the phone number the image came from.'))
    } else {
      return BbPromise.resolve({
        event,
        body,
      })
    }
  },
  getResources: results => BbPromise.all([
    impl.getImageFromTwilio(results),
    impl.getAssignment(results),
  ]),
  /**
   * Twilio sends a URI from which a user's image can downloaded.  Download it.
   * @param results The event representing the HTTPS request from Twilio (SMS sent notification)
   */
  getImageFromTwilio: (results) => {
    const uri = url.parse(results.body.MediaUrl0)
    if (aws.config.httpOptions.agent) {
      uri.agent = aws.config.httpOptions.agent
    }
    return got.get(uri, { encoding: null }).then(
      res => BbPromise.resolve({
        contentType: results.body.MediaContentType0,
        data: res.body,
      }) // eslint-disable-line comma-dangle
    )
  },
  /**
   * The Twilio request doesn't contain any of the original product creation event that caused the assignment.  Obtain the
   * assignment associated with the number that this message/image is being received from.
   * @param results The event representing the HTTPS request from Twilio (SMS sent notification)
   */
  getAssignment: (results) => {
    const params = {
      Key: {
        number: results.body.From,
      },
      TableName: constants.TABLE_PHOTO_ASSIGNMENTS_NAME,
      AttributesToGet: [
        'taskToken',
        'taskEvent',
      ],
      ConsistentRead: false,
      ReturnConsumedCapacity: 'NONE',
    }
    return dynamo.get(params).promise()
      .then(
        (data) => {
          if (!data.Item) {
            return BbPromise.reject(new UserError('Oops!  We couldn\'t find your assignment.  If you have registered and not completed your assignments, we will send one shortly.'))
          } else {
            const item = data.Item
            item.taskEvent = JSON.parse(item.taskEvent)
            return BbPromise.resolve(item)
          }
        },
        ex => BbPromise.reject(new ServerError(`Failed to retrieve assignment: ${ex}`)) // eslint-disable-line comma-dangle
      )
  },
  /**
   * Using the results of the `getImageFromTwilio` and `getAssignment` invocations, place the obtained image into the
   * proper location of the bucket for use in the web UI.
   * @param results An array of results obtained from `getResources`.  Details:
   *          results[0] = image       // The user's image that was downloaded from Twilio
   *          results[1] = assignment  // The assignment associated with the given request's phone number
   */
  storeImage: (results) => {
    const image = results[0]
    const assignment = results[1]

    const bucketKey = `i/p/${assignment.taskEvent.data.id}`

    const params = {
      Bucket: constants.IMAGE_BUCKET,
      Key: bucketKey,
      Body: image.data,
      ContentType: image.contentType,
      Metadata: {
        from: assignment.taskEvent.photographer.phone,
      },
    }
    return s3.putObject(params).promise().then(
      () => BbPromise.resolve({
        assignment,
        image: `${constants.IMAGE_BUCKET}/${bucketKey}`, // TODO this assumes parity between bucket name and website URI
      }),
      ex => BbPromise.reject(new ServerError(`Error placing image into S3: ${ex}`)) // eslint-disable-line comma-dangle
    )
  },
  /**
   * Indicate the successful completion of the photographer's image assignment to the StepFunction
   * @param results The results of the placeImage, containing the assignment and new image location
   */
  sendStepSuccess: (results) => {
    const taskEvent = results.assignment.taskEvent
    taskEvent.image = results.image
    taskEvent.success = 'true'
    const params = {
      output: JSON.stringify(taskEvent),
      taskToken: results.assignment.taskToken,
    }
    return stepfunctions.sendTaskSuccess(params).promise().then(
      () => BbPromise.resolve(taskEvent),
      err => BbPromise.reject(`Error sending success to Step Function: ${err}`) // eslint-disable-line comma-dangle
    )
  },
  userErrorResp: (error) => {
    const msg = new Twilio.TwimlResponse()
    msg.message(error.message)
    return msg.toString()
  },
  thankYouForImage: (taskEvent) => {
    const msg = new Twilio.TwimlResponse()
    msg.message(`Thanks so much ${taskEvent.photographer.name}!`)
    return msg.toString()
  },
}
/**
 * API (External)
 */
module.exports = {
  handler: (event, context, callback) => {
    impl.validateApiGatewayRequest(event)
      .then(impl.ensureAuthTokenDecrypted)
      .then(impl.validateTwilioRequest)
      .then(impl.getResources)
      .then(impl.storeImage)
      .then(impl.sendStepSuccess)
      .then(impl.thankYouForImage)
      .then((msg) => {
        const response = util.response(200, msg)
        response.headers['Content-Type'] = 'text/xml'
        callback(null, response)
      })
      .catch(ClientError, (ex) => {
        console.log(`${constants.MODULE} - ${ex.stack}`)
        callback(null, util.response(400, `${ex.name}: ${ex.message}`))
      })
      .catch(AuthError, (ex) => {
        console.log(`${constants.MODULE} - ${ex.stack}`)
        callback(null, util.response(403, constants.ERROR_UNAUTHORIZED))
      })
      .catch(UserError, (ex) => {
        console.log(`${constants.MODULE} - ${ex.stack}`)
        const response = util.response(200, impl.userErrorResp(ex))
        response.headers['Content-Type'] = 'text/xml'
        callback(null, response)
      })
      .catch(ServerError, (ex) => {
        console.log(`${constants.MODULE} - ${ex.stack}`)
        callback(null, util.response(500, ex.name))
      })
      .catch((ex) => {
        console.log(`${constants.MODULE} - Uncaught exception: ${ex.stack}`)
        callback(null, util.response(500, constants.ERROR_SERVER))
      })
  },
}
