'use strict';

/* ********************************************************************
 *                 Hello Retail Minimization:
 *  - Removed all Twilio code, in charge of Twilio authentication,
 *    request validation, and ack responses (error, success messages
 *    sent to photographer).
 *  - Changed returned values to a simple string instead of HTTP
 *    response.
 * ******************************************************************** */

const AJV = require('ajv');
const aws = require('aws-sdk'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies
const BbPromise = require('bluebird');
const got = require('got');
const url = require('url');

/**
 * AJV
 */
// TODO Get these from a better place later
const receiveRequestSchema = require('./receive-request-schema.json');
const photoAssignmentSchema = require('./photo-assignment-schema.json');

// TODO generalize this?  it is used by but not specific to this module
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`;

const receiveRequestSchemaId = makeSchemaId(receiveRequestSchema);
const photoAssignmentSchemaId = makeSchemaId(photoAssignmentSchema);


const ajv = new AJV();
ajv.addSchema(receiveRequestSchema, receiveRequestSchemaId);
ajv.addSchema(photoAssignmentSchema, photoAssignmentSchemaId);

/**
 * AWS
 */
aws.config.setPromisesDependency(BbPromise);
const dynamo = new aws.DynamoDB.DocumentClient();
const kms = new aws.KMS();
const s3 = new aws.S3();
const stepfunctions = new aws.StepFunctions();

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
  METHOD_GET_IMAGE_FROM_EVENT: 'impl.getImageFromEvent',
  METHOD_PLACE_IMAGE_IN_S3: 'impl.storeImage',
  METHOD_SEND_STEP_SUCCESS: 'impl.sendStepSuccess',

  // External
  ENDPOINT: process.env.ENDPOINT,
  IMAGE_BUCKET: process.env.IMAGE_BUCKET,
  TABLE_PHOTO_ASSIGNMENTS_NAME: process.env.TABLE_PHOTO_ASSIGNMENTS_NAME,
};

/**
 * Errors
 */
class ClientError extends Error {
  constructor(message) {
    super(message);
    this.name = constants.ERROR_CLIENT
  }
}
class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = constants.ERROR_UNAUTHORIZED
  }
}
class UserError extends Error {
  constructor(message) {
    super(message);
    this.name = constants.ERROR_USER
  }
}
class ServerError extends Error {
  constructor(message) {
    super(message);
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
    console.log(constants.HASHES);
    console.log(constants.ERROR_SECURITY_RISK);
    console.log(`${constants.METHOD_TODO} ${constants.ERROR_DATA_CORRUPTION} could not validate data to '${schemaId}' schema. Errors: ${ajvErrors}`);
    console.log(`${constants.METHOD_TODO} ${constants.ERROR_DATA_CORRUPTION} bad data: ${JSON.stringify(items)}`);
    console.log(constants.HASHES);
    return util.response(500, constants.ERROR_SERVER)
  },
  decrypt: (field, value) => kms.decrypt({ CiphertextBlob: new Buffer(value, 'base64') }).promise().then(
    data => BbPromise.resolve(data.Plaintext.toString('ascii')),
    err => BbPromise.reject(new ServerError(`Error decrypting '${field}': ${err}`)) // eslint-disable-line comma-dangle
  ),
};

/**
 * Implementation (Internal)
 */
const impl = {
  /**
   * Validate that the given event validates against the request schema
   * @param event The event representing the HTTPS requests
   */
  validateApiGatewayRequest: (event) => {
    if (!ajv.validate(receiveRequestSchemaId, event)) { // bad request
      return BbPromise.reject(new ClientError(`could not validate request to '${receiveRequestSchemaId}' schema. Errors: '${ajv.errorsText()}' found in event: '${JSON.stringify(event)}'`))
    } else {
      return BbPromise.resolve(event)
    }
  },
  getResources: results => BbPromise.all([
    impl.getImageFromEvent(results),
    impl.getAssignment(results),
  ]),
  /**
   * The event includes a URI from which a user's image can downloaded.  Download it.
   * @param results The event representing the HTTPS request.
   */
  getImageFromEvent: (results) => {
    const uri = url.parse(results.body.MediaUrl0);
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
   * The request doesn't contain any of the original product creation event that caused the assignment.  Obtain the
   * assignment associated with the number that this message/image is being received from.
   * @param results The event representing the HTTPS request
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
    };
    return dynamo.get(params).promise()
      .then(
        (data) => {
          if (!data.Item) {
            return BbPromise.reject(new UserError('Oops!  We couldn\'t find your assignment.  If you have registered and not completed your assignments, we will send one shortly.'))
          } else {
            const item = data.Item;
            item.taskEvent = JSON.parse(item.taskEvent);
            return BbPromise.resolve(item)
          }
        },
        ex => BbPromise.reject(new ServerError(`Failed to retrieve assignment: ${ex}`)) // eslint-disable-line comma-dangle
      )
  },
  /**
   * Using the results of the `getImageFromEvent` and `getAssignment` invocations, place the obtained image into the
   * proper location of the bucket for use in the web UI.
   * @param results An array of results obtained from `getResources`.  Details:
   *          results[0] = image       // The user's image that was downloaded
   *          results[1] = assignment  // The assignment associated with the given request's phone number
   */
  storeImage: (results) => {
    const image = results[0];
    const assignment = results[1];

    const bucketKey = `i/p/${assignment.taskEvent.data.id}`;

    const params = {
      Bucket: constants.IMAGE_BUCKET,
      Key: bucketKey,
      Body: image.data,
      ContentType: image.contentType,
      Metadata: {
        from: assignment.taskEvent.photographer.phone,
      },
    };
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
    const taskEvent = results.assignment.taskEvent;
    taskEvent.image = results.image;
    taskEvent.success = 'true';
    const params = {
      output: JSON.stringify(taskEvent),
      taskToken: results.assignment.taskToken,
    };
    return stepfunctions.sendTaskSuccess(params).promise().then(
      () => BbPromise.resolve(taskEvent),
      err => BbPromise.reject(`Error sending success to Step Function: ${err}`) // eslint-disable-line comma-dangle
    )
  },
  thankYouForImage: taskEvent => `Thanks so much ${taskEvent.photographer.name}!`,
};
/**
 * API (External)
 */
module.exports = {
  handler: (event, context, callback) => {
    impl.validateApiGatewayRequest(event)
      .then(impl.getResources)
      .then(impl.storeImage)
      .then(impl.sendStepSuccess)
      .then(impl.thankYouForImage)
      .then((msg) => {
        callback(null, msg)
      })
      .catch(ClientError, (ex) => {
        console.log(`${constants.MODULE} - ${ex.stack}`);
        callback(null, `${ex.name}: ${ex.message}`)
      })
      .catch(AuthError, (ex) => {
        console.log(`${constants.MODULE} - ${ex.stack}`);
        callback(null, constants.ERROR_UNAUTHORIZED)
      })
      .catch(UserError, (ex) => {
        console.log(`${constants.MODULE} - ${ex.stack}`);
        callback(null, ex.message)
      })
      .catch(ServerError, (ex) => {
        console.log(`${constants.MODULE} - ${ex.stack}`);
        callback(null, ex.name)
      })
      .catch((ex) => {
        console.log(`${constants.MODULE} - Uncaught exception: ${ex.stack}`);
        callback(null, constants.ERROR_SERVER)
      })
  },
};
