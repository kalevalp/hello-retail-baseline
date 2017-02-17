'use strict';

const fs = require('fs')
const spawnSync = require('child_process').spawnSync

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    // TODO: Open question: Is it better to define own command or use existing build lifecycle? Seems latter woule
    this.commands = {
      buildWebApp: {
        usage: 'Consumes the serverless.yml template to construct the web application config.js containing the appropriate values.',
        lifecycleEvents: [ 'config', 'build' ]
      }
    }
    this.hooks = {
      'buildWebApp:config': this.configureWebApp.bind(this),
      'buildWebApp:build': this.buildWebApp.bind(this),
      'after:deploy:deploy': this.uploadWebApp.bind(this)
    }

    this.getConfig = this.getConfig.bind(this)
    this.validateConfig = this.validateConfig.bind(this)
  }

  getConfig() {
    return this.serverless.service.custom && this.serverless.service.custom.webAppBuild
  }

  validateConfig(config) {
    if(!config) {
      // TODO: Erorr and stop build
      this.serverless.cli.log('No configuration set for web app config.')
      this.serverless.cli.log('Use `custom.webAppBuild` to define values needed.')
      return false
    }

    if(!config.configPath) {
      // TODO: Erorr and stop build
      this.serverless.cli.log('Path to config file is required.')
      this.serverless.cli.log('Use `custom.webAppBuild.configPath` to set the path to the write the web applicaiton\'s configuration file.')
      return false
    }

    if(!config.configValues) {
      // TODO: Erorr and stop build
      this.serverless.cli.log('Configuration values must be provided.')
      this.serverless.cli.log('Use `custom.webAppBuild.configValues` to define the set of config values to provide the web application.')
      return false
    }

    if(!config.webpackPath) {
      // TODO: Erorr and stop build
      this.serverless.cli.log('Path to webpack config file must be provided.')
      this.serverless.cli.log('Use `custom.webAppBuild.webpackPath` to define the webpack config file to package the web app code.')
      return false
    }

    return true
  }

  buildWebApp() {
    const config = this.getConfig()
    if(!this.validateConfig(config)) {
      return
    }

    this.serverless.cli.log(`Running webpack to build application with config ${config.webpackPath} ...`)

    const process = spawnSync(`${__dirname}/../../node_modules/.bin/webpack`, ['--config', config.webpackPath])
    const stdout = process.stdout.toString()
    const stderr = process.stderr.toString()

    if(stdout) {
      this.serverless.cli.log(stdout)
    }

    if(stderr) {
      this.serverless.cli.log(stderr)
    }

    this.serverless.cli.log(`Webpack Done.`)
  }

  uploadWebApp() {
    const config = this.getConfig()
    if(!this.validateConfig(config)) {
      return
    }

    this.serverless.cli.log(`Uploading files from /app to S3 ...`)

    const stage = this.serverless.variables.service.custom.stage
    const s3Bucket = stage === 'prod' ?
                     this.serverless.service.custom.domainName :
                     `${stage}.${this.serverless.service.custom.domainName}`

    console.log(s3Bucket)

    const args = [
      's3',
      'sync',
      `${__dirname}/../app/`,
      `s3://${s3Bucket}/`,
    ]

    console.log(args)

    const process = spawnSync('aws', args)
    const stdout = process.stdout.toString()
    const stderr = process.stderr.toString()

    if(stdout) {
      this.serverless.cli.log(stdout)
    }

    if(stderr) {
      this.serverless.cli.log(stderr)
    }

    this.serverless.cli.log(`Upload to S3 Done.`)
  }

  configureWebApp() {
    const config = this.getConfig()
    const webConfig = ['module.exports = {']

    if(!this.validateConfig(config)) {
      console.log(config)
      return
    }

    this.serverless.cli.log('Collecting configuration values ...')
    for(const name of Object.keys(config.configValues)) {
      let value = config.configValues[name]
      if(typeof value === 'string') {
        webConfig.push(` '${name}': '${value}',`)
      } else {
        this.serverless.cli.log(`WARNING: Web App config property ${name} was not a string. Ignoring.`)
      }
    }

    webConfig.push('}')

    this.serverless.cli.log(`Writing web config file to ${config.configPath} ...`)
    fs.writeFileSync(config.configPath, webConfig.join('\n'))
    this.serverless.cli.log('Done.')
  }
}

module.exports = ServerlessPlugin
