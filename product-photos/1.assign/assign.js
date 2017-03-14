'use strict'

const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

const dynamo = new aws.DynamoDB.DocumentClient()

const constants = {
  MODULE: 'assign.js',
}

const impl = {
  assignPhotographer: (/* event */) => {
    // TODO get this dynamically
    const assignedPhotographer = {
      name: 'Erik Erikson',
      phone: '+<num>',
    }
    const assignedPhotographer2 = {
      name: 'Greg Smith',
      phone: '+<num>',
    }
    const assignedPhotographer3 = {
      name: 'Rob Gruhl',
      phone: '+<num>',
    }
    return assignedPhotographer
  },
}

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
//   }
// }
exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event))

  const result = event

  if (!result.photographers || !Array.isArray(result.photographers)) {
    result.photographers = []
  }
  result.photographer = impl.assignPhotographer(result)
  result.photographers.push(result.photographer.name)
  result.success = 'false'

  callback(null, result)
}
