import AWS from 'aws-sdk'
import { combineReducers } from 'redux'
import config from 'config'
import { types } from 'actions'

const {
  AWS_ROLE_ASSUMED,
  USER_LOGIN_COMPLETE,
  SHOW_CATEGORIES,
  SHOW_PRODUCTS,
  CLEAR_PRODUCTS,
  SHOW_PRODUCT_BY_ID,
  CLEAR_PRODUCT_BY_ID,
  WAITING_START,
  WAITING_STOP,
} = types

export const login = (
  state = {
    clientId: config.AuthClientId,
    loggedIn: false,
  }, action) => {
  switch (action.type) {
    case USER_LOGIN_COMPLETE:
      return {
        ...state,
        customerId: action.customerId,
        customerName: action.name,
        loggedIn: true,
      }
    default:
      return state
  }
}

export const aws = (state = {
  sessionName: config.SessionName,
  webAppRole: config.WebAppRole,
  sts: new AWS.STS(),
  roleAssumed: false,
}, action) => {
  switch (action.type) {
    case AWS_ROLE_ASSUMED:
      AWS.config.credentials = new AWS.Credentials(action.accessKey, action.secretKey, action.sessionToken)
      AWS.config.update({ region: config.AWSRegion })

      return {
        ...state,
        roleAssumed: true,
        dynamo: new AWS.DynamoDB(),
      }
    default:
      return state
  }
}

export const categories = (state = [], action) => {
  switch (action.type) {
    case SHOW_CATEGORIES:
      return action.categories
    default:
      return state
  }
}

export const products = (state = [], action) => {
  switch (action.type) {
    case SHOW_PRODUCTS:
      return action.products
    case CLEAR_PRODUCTS:
      return []
    default:
      return state
  }
}

export const product = (state = [], action) => {
  switch (action.type) {
    case SHOW_PRODUCT_BY_ID:
      return {
        ...action.product,
      }
    case CLEAR_PRODUCT_BY_ID:
      return {}
    default:
      return state
  }
}

export const waiting = (state = false, action) => {
  switch (action.type) {
    case WAITING_START:
      return true
    case WAITING_STOP:
      return false
    default:
      return state
  }
}

export default combineReducers({
  aws,
  categories,
  login,
  products,
  product,
})
