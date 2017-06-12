'use strict'

const AWS = require('aws-sdk') // eslint-disable-line import/no-extraneous-dependencies
const inquirer = require('inquirer') // eslint-disable-line import/no-extraneous-dependencies

const CANCEL = 'CANCEL'
const ALL_STACKS = '*** DELETE ALL STACKS ***'

const stackNameRegEx = /^(ingress-stream-|winner-view-|winner-api-)[a-zA-Z0-9]{4}$/

const cloudFormation = new AWS.CloudFormation()

const impl = {
  queryStacks: function queryStacks(nextToken, allStacks) {
    const params = {
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE'],
      NextToken: nextToken,
    }

    if (!allStacks) allStacks = [] // eslint-disable-line no-param-reassign

    return cloudFormation.listStacks(params).promise()
      .then((stacks) => {
        allStacks = allStacks.concat(stacks.StackSummaries) // eslint-disable-line no-param-reassign

        if (stacks.NextToken) {
          return queryStacks(stacks.NextToken, allStacks)
        } else {
          return allStacks
        }
      })
  },

  removeStacks: function removeStacks(stackList, currentStack) {
    if (!currentStack) currentStack = 0  // eslint-disable-line no-param-reassign

    const params = {
      StackName: stackList[currentStack],
    }

    let message = `Deleting stack: ${params.StackName}...`
    if (stackList.length > 1) {
      message += ` (${currentStack + 1} of ${stackList.length})`
    }

    console.log(message)

    return cloudFormation.deleteStack(params).promise()
      .then(() => {
        console.log(`${params.StackName} deleted.`)

        currentStack += 1 // eslint-disable-line no-param-reassign

        if (currentStack < stackList.length) {
          return impl.removeStacks(stackList, currentStack)
        } else {
          return Promise.resolve('Done.')
        }
      })
  },

  deleteAllStacks: function deleteAllStacks(allStacks) {
    return inquirer.prompt([{
      message: 'Are you sure? (yes/NO) ',
      choices: ['yes', 'NO'],
      default: 'NO',
      name: 'confirm',
    }])
    .then((answers) => {
      if (answers.confirm === 'yes') {
        return impl.removeStacks(allStacks)
      } else {
        return Promise.resolve('Cancelled.')
      }
    })
  },

  main: function main() {
    impl.queryStacks()
      .then((stacks) => {
        const filtered = stacks.filter(stack => stackNameRegEx.test(stack.StackName))
        const stackNames = filtered.map(s => s.StackName)

        if (stackNames.length === 0) {
          return Promise.resolve(`No stacks found matching ${stackNameRegEx} Exiting.`)
        }

        console.log(`Found ${stackNames.length} stacks.`)

        return inquirer.prompt([{
          type: 'list',
          name: 'stackSelection',
          message: 'Choose which stacks to delete:',
          choices:
            [ALL_STACKS]
            .concat(stackNames)
            .concat([CANCEL]),
        }])
        .then((answers) => {
          switch (answers.stackSelection) {
            case CANCEL:
              return Promise.resolve('Cancelled.')
            case ALL_STACKS:
              return impl.deleteAllStacks(stackNames)
            default:
              return impl.removeStacks([answers.stackSelection])
          }
        })
      })
      .then((message) => {
        console.log(message)
      })
      .catch((error) => {
        console.error(`ERROR: ${error}`)
        process.exit(1)
      })
  },
}

impl.main()
