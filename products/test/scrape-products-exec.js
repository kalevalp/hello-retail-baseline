'use strict';

const aws0 = require('aws-sdk');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent');
const path = require('path');
const Serverless = require('./serverless-fx');
const url = require('url');
const yaml = require('js-yaml');

const secrets = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '..', '..', 'private.yml'), 'utf8'));

const event = require('./../lambda/scrape-products/event.json');
const targetHandler = require('./../lambda/scrape-products/scrape-products.js').handler;

const PROXY_SERVER = secrets.proxyServer;
const AWS_REGION = secrets.region;
const AWS_PROFILE = secrets.profile;

aws0.config.region = AWS_REGION;
aws0.config.credentials = new aws0.SharedIniFileCredentials({ profile: AWS_PROFILE });
if (PROXY_SERVER) {
  aws0.config.httpOptions.agent = new HttpsProxyAgent(url.parse(PROXY_SERVER));
}

const serverless = new Serverless({
  interactive: false,
  servicePath: path.join(__dirname, '..', 'lambda'),
});

serverless.init()
  .then(() => {
    serverless.variables.populateService(serverless.pluginManager.cliOptions);

    const roleName = `${serverless.service.custom.stage}RetailStreamWriter`;
    const accountId = secrets.accountId;

    process.env.STREAM_NAME = `${serverless.service.custom.stage}RetailStream`;
    process.env.STREAM_WRITER_ROLE = `arn:aws:iam::${accountId}:role/${roleName}`;
    process.env.AWS_REGION = AWS_REGION;

    targetHandler(event, null, (err, res) => {
      console.log('Handler execution complete with results:');
      console.log('\tError: ', (typeof err === 'object') ? JSON.stringify(err, null, 2) : err);
      if (res && res.aggregate) {
        res.aggregate.latencies = undefined;  // eslint-disable-line no-param-reassign
        console.log('\tResult:', (typeof res === 'object') ? JSON.stringify(res.aggregate, null, 2) : res);
      } else if (res && Array.isArray(res)) {
        console.log('\tResults:');
        for (let i = 0; i < res.length; i++) {
          res[i].aggregate.latencies = undefined; // eslint-disable-line no-param-reassign
          console.log('\t\t', (typeof res[i] === 'object') ? JSON.stringify(res[i].aggregate, null, 2) : res[i]);
        }
      } else {
        console.log('\tResults to be output to exterior system');
      }
    });
  });
