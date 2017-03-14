'use strict'

const aws0 = require('aws-sdk')
const fs = require('fs')
const HttpsProxyAgent = require('https-proxy-agent')
const path = require('path')
const Serverless = require('./serverless-fx')
const url = require('url')
const yaml = require('js-yaml')

const secrets = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '..', '..', 'private.yml'), 'utf8'))

const event = require('./../lambda/scrape-products/event.json')
const targetHandler = require('./../lambda/scrape-products/scrape-products.js').handler

const PROXY_SERVER = secrets.proxyServer
const AWS_REGION = secrets.region
const AWS_PROFILE = secrets.profile
const SLS_STAGE = secrets.stage

process.env.proxy = secrets.proxyServer
process.env.AWS_PROFILE = secrets.profile
process.env.AWS_PROFILE = secrets.region

aws0.config.region = AWS_REGION
aws0.config.credentials = new aws0.SharedIniFileCredentials({ profile: AWS_PROFILE })

if (PROXY_SERVER) {
  const proxyOptions = url.parse(PROXY_SERVER)
  proxyOptions.secureEndpoint = true
  aws0.config.httpOptions.agent = new HttpsProxyAgent(proxyOptions)
}

if (SLS_STAGE) {
  process.argv = [null, null, '-s', SLS_STAGE]
}

const serverless = new Serverless({
  interactive: false,
  servicePath: path.join(__dirname, '..', 'lambda'),
})

serverless.init()
  .then(() => {
    serverless.variables.populateService(serverless.pluginManager.cliOptions)

    const roleName = `${serverless.service.custom.stage}RetailStreamWriter`
    const accountId = secrets.accountId

    process.env.STREAM_NAME = `${serverless.service.custom.stage}RetailStream`
    process.env.STREAM_WRITER_ROLE = `arn:aws:iam::${accountId}:role/${roleName}`
    process.env.AWS_REGION = AWS_REGION

    targetHandler(event, null, (err, res) => {
      console.log('Handler execution complete.')

      if (err) {
        throw new Error(err)
      } else {
        console.log(res)
      }
    })
  })
