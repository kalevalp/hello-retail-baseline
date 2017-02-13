'use strict'

const execSync = require('child_process').execSync
const path = require('path')

let sls

try {
  if (process.env.SLS_ROOT) {
    sls = require(path.join(process.env.SLS_ROOT, '/serverless/lib/Serverless')) // eslint-disable-line import/no-dynamic-require, global-require
  }
} catch (ex) {
  console.log(`error attemping to load Serverless from '${process.env.SLS_ROOT}/serverless/lib/Serverless':\n${ex}\nWill attempt to load from local node_modules next.`)
} finally {
  if (!sls) {
    try {
      sls = require('serverless') // eslint-disable-line global-require
    } catch (ex) {
      console.log('error attempting to load Serverless from local node_modules, attemping global load')
      const npmGlobalRoot = execSync('npm -g root', { encoding: 'utf-8' }).trim()
      sls = require(path.join(npmGlobalRoot, 'serverless/lib/Serverless')) // eslint-disable-line import/no-dynamic-require, global-require
    }
  }
}

module.exports = sls
