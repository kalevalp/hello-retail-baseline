'use strict';

const execSync = require('child_process').execSync;
const path = require('path');

let slsFound = null;

try {
  // eslint-disable-next-line global-require, import/no-unresolved, import/no-extraneous-dependencies
  slsFound = require('serverless');
} catch (ex) {
  const npmGlobalRoot = execSync('npm -g root', { encoding: 'utf-8' }).trim();

  // eslint-disable-next-line import/no-dynamic-require, global-require
  slsFound = require(path.join(npmGlobalRoot, 'serverless/lib/Serverless'));
}

module.exports = slsFound;
