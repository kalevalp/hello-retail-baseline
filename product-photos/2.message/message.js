'use strict';

/* ********************************************************************
 *                 Hello Retail Minimization:
 *  - Removed all twilio code, in particular all code in charge of
 *    sdk, key decryption, and message send.
 *  - Removed all aws.kms code, which was used for managing keys.
 *  - Removed all aws code, which was only used for kms.
 * ******************************************************************** */

const BbPromise = require('bluebird');
const nodemailer = require('nodemailer');

/**
 * Constants
 */
const constants = {
  // internal
  ERROR_SERVER: 'Server Error',
  // module and method names
  MODULE: 'message.js',
  METHOD_HANDLER: 'handler',
  METHOD_SEND_MESSAGE: 'sendMessage',
};

/**
 * Errors
 */
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
  serverError: (method, err) => {
    console.log(`${constants.MODULE} ${method} - ${constants.ERROR_SERVER}: ${err}`);
    return util.response(500, constants.ERROR_SERVER)
  },
};

/**
 * Implementation (Internal)
 */
const impl = {
  sendMessage: (event) => {
    function createTransporter(account) {
      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: account.user, // generated ethereal user
          pass: account.pass,  // generated ethereal password
        },
      });
      return Promise.resolve(transporter);
    }

    const messageText =
      `
Hello ${event.photographer.name}!
Please snap a pic of:
    ${event.data.name}

Created by:
    ${event.merchantName}`;

    const mailOptions = {
      from: '"The Store" <boss@store.com>',
      to: event.photographer.email,
      subject: 'New Photography Assignment From The Store',
      text: messageText,
      html: `<p>${messageText}</p>`,
    };

    // console.log('Sending Email!'),
    nodemailer.createTestAccount()
      .then(createTransporter())
      .then(trans => trans.sendMail(mailOptions))
      .then(
        (info) => {
          console.log('Message sent: %s', info.messageId);
          // Preview only available when sending through an Ethereal account
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

          return Promise.resolve(info);
        })
      .catch(
        err => BbPromise.reject(new ServerError(`${constants.METHOD_SEND_MESSAGE} - Error sending message to photographer: ${JSON.stringify(err, null, 2)}`)) // eslint-disable-line comma-dangle
      );
  },
};

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
//   },
//   photographers: ['Erik'],
//   photographer: {
//     name: 'Erik',
//     phone: '+<num>',
//   },
// }
// Example Message Create Success Response:
// {
//   sid: '<mid>',
//   date_created: 'Tue, 14 Feb 2017 01:32:57 +0000',
//   date_updated: 'Tue, 14 Feb 2017 01:32:57 +0000',
//   date_sent: null,
//   account_sid: '<sid>',
//   to: '+<to_num>',
//   from: '+<from_num>',
//   messaging_service_sid: null,
//   body: 'Hello ${photographer.name}!\\nPlease snap a pic of:\\n Polo Ralph Lauren 3-Pack Socks',
//   status: 'queued',
//   num_segments: '1',
//   num_media: '0',
//   direction: 'outbound-api',
//   api_version: '2010-04-01',
//   price: null,
//   price_unit: 'USD',
//   error_code: null,
//   error_message: null,
//   uri: '/2010-04-01/Accounts/<sid>/Messages/<mid>.json',
//   subresource_uris: {
//     media: '/2010-04-01/Accounts/<sid>/Messages/<mid>/Media.json',
//   },
//   dateCreated: '2017-02-14T01:32:57.000Z',
//   dateUpdated: '2017-02-14T01:32:57.000Z',
//   dateSent: null,
//   accountSid: '<sid>',
//   messagingServiceSid: null,
//   numSegments: '1',
//   numMedia: '0',
//   apiVersion: '2010-04-01',
//   priceUnit: 'USD',
//   errorCode: null,
//   errorMessage: null,
//   subresourceUris: {
//     media: '/2010-04-01/Accounts/<sid>/Messages/<mid>/Media.json',
//   },
// }
// Example Error Response:
// {
//   Error: 'HandledError',
//   Cause: {
//     errorMessage: {
//       status: 400,
//       message: 'The From phone number <from_num> is not a valid, SMS-capable inbound phone number or short code for your account.',
//       code: 21606,
//       moreInfo: 'https://www.twilio.com/docs/errors/21606'
//     },
//   },
// }
module.exports = {
  handler: (event, context, callback) => {
    console.log(JSON.stringify(event, null, 2));
    BbPromise.resolve(event)
      .then(impl.sendMessage)
      .then((messageInfo) => {
        console.log(`Success: ${JSON.stringify(messageInfo, null, 2)}`);
        callback(null, event)
      })
      .catch((ex) => {
        console.log(JSON.stringify(ex, null, 2));
        callback(`${constants.MODULE} ${ex.message}:\n${ex.stack}`)
      })
  },
};
