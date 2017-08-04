import https from 'https'
import AWS from 'aws-sdk'
import config from 'config'

export const types = {
  AWS_ROLE_ASSUMED: 'AWS_ROLE_ASSUMED',
  USER_LOGIN_READY: 'USER_LOGIN_READY',
  USER_LOGIN_COMPLETE: 'USER_LOGIN_COMPLETE',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_SET_PROFILE: 'USER_SET_PROFILE',
  LOAD_CATEGORIES: 'LOAD_CATEGORIES',
  SHOW_CATEGORIES: 'SHOW_CATEGORIES',
  LOAD_PRODUCTS: 'LOAD_PRODUCTS',
  SHOW_PRODUCTS: 'SHOW_PRODUCTS',
  CLEAR_PRODUCTS: 'CLEAR_PRODUCTS',
  LOAD_PRODUCT_BY_ID: 'LOAD_PRODUCT_BY_ID',
  SHOW_PRODUCT_BY_ID: 'SHOW_PRODUCT_BY_ID',
  CLEAR_PRODUCT_BY_ID: 'CLEAR_PRODUCT_BY_ID',
  BUY_PRODUCT: 'BUY_PRODUCT',
  BUY_PRODUCT_COMPLETE: 'BUY_PRODUCT_COMPLETE',
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  REGISTER_PHOTOGRAPHER: 'REGISTER_PHOTOGRAPHER',
  REGISTER_PHOTOGRAPHER_COMPLETE: 'REGISTER_PHOTOGRAPHER_COMPLETE',
  REGISTER_PHOTOGRAPHER_RESET: 'REGISTER_PHOTOGRAPHER_RESET',
}

export const applicationError = error => ({
  type: types.USER_LOGIN_FAILED,
  error,
})

const makeApiRequest = (api, verb, path, data, nextAction) =>
  (dispatch) => {
    const apiPath = `/${config.Stage}${path}`
    const body = JSON.stringify(data)
    const hostname = `${api}.execute-api.${config.AWSRegion}.amazonaws.com`
    const endpoint = new AWS.Endpoint(hostname)
    const request = new AWS.HttpRequest(endpoint)

    request.method = verb
    request.path = apiPath
    request.region = config.AWSRegion
    request.host = endpoint.host
    request.body = body
    request.headers.Host = endpoint.host

    const signer = new AWS.Signers.V4(request, 'execute-api')
    signer.addAuthorization(AWS.config.credentials, new Date())

    const postRequest = https.request(request, (response) => {
      let result = ''
      response.on('data', d => (result += d))
      response.on('end', () => {
        dispatch(nextAction(result))
      })
      response.on('error', (error) => {
        dispatch(applicationError(error))
      })
    })

    postRequest.write(body)
    postRequest.end()
  }

export const productCreated = () => ({
  type: types.PRODUCT_CREATED,
})

export const createNewProduct = (createdById, createdByName, product) => {
  const { category, name, brand, description } = product
  return makeApiRequest(
    config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/product/create/1-0-0',
      id: (`0000000${Math.floor(Math.abs(Math.random() * 10000000))}`).substr(-7),
      origin: `hello-retail/web-client-create-product/${createdById}/${createdByName}`,
      category,
      name,
      brand,
      description,
    }, productCreated,
  )
}

export const setUserProfile = (name, customerId) => ({
  type: types.USER_LOGIN_COMPLETE,
  customerId,
  name,
})

export const retrieveProfile = (amazonLogin, accessToken) =>
  (dispatch) => {
    amazonLogin.retrieveProfile(accessToken, (response) => {
      if (!response.success) {
        dispatch(applicationError('Failed to get Amazon Login profile'))
      } else {
        dispatch(setUserProfile(response.profile.Name, response.profile.CustomerId))
      }
    })
  }

export const setAwsCredentials = (accessKey, secretKey, sessionToken) => ({
  type: types.AWS_ROLE_ASSUMED,
  accessKey,
  secretKey,
  sessionToken,
})

export const assumeWebRole = token =>
  (dispatch, getState) => {
    const sts = getState().aws.sts
    const params = {
      DurationSeconds: 3600,
      ProviderId: 'www.amazon.com',
      RoleArn: getState().aws.webAppRole,
      RoleSessionName: getState().aws.sessionName,
      WebIdentityToken: token,
    }

    sts.assumeRoleWithWebIdentity(params, (error, identity) => {
      if (error) {
        dispatch(applicationError(`Failed to assume web identity role: ${error}`))
      } else {
        // also include TTL for session ...
        dispatch(setAwsCredentials(
          identity.Credentials.AccessKeyId,
          identity.Credentials.SecretAccessKey,
          identity.Credentials.SessionToken,
          Date.now() + (1000 * (params.DurationSeconds - 10)),
        ))
      }
    })
  }

export const userLoginReady = (amazonLogin, interactive) =>
  (dispatch, getState) => {
    amazonLogin.setClientId(getState().login.clientId)
    amazonLogin.authorize({
      scope: 'profile',
      interactive,
    }, (response) => {
      if (response.error) {
        dispatch(applicationError(response.error))
      } else {
        dispatch(retrieveProfile(amazonLogin, response.access_token))
        dispatch(assumeWebRole(response.access_token))
      }
    })
  }

export const showCategories = categories => ({
  type: types.SHOW_CATEGORIES,
  categories,
})

export const loadCategories = () =>
  (dispatch, getState) => {
    const { dynamo } = getState().aws

    dynamo.scan({
      TableName: config.ProductCategoryTableName,
      AttributesToGet: ['category'],
    }, (error, data) => {
      if (error) {
        dispatch(applicationError(error))
      } else {
        const categoriesList = []
        data.Items.forEach((item) => {
          categoriesList.push({
            name: item.category.S,
          })
        })
        dispatch(showCategories(categoriesList))
      }
    })
  }

export const showProductsInCategory = products => ({
  type: types.SHOW_PRODUCTS,
  products,
})

export const loadProductsInCategory = category =>
  (dispatch, getState) => {
    const { dynamo } = getState().aws

    dynamo.query({
      ProjectionExpression: '#br, #de, #na, id',
      TableName: config.ProductCatalogTableName,
      IndexName: 'Category',
      KeyConditionExpression: '#ct = :ct',
      ExpressionAttributeNames: {
        '#br': 'brand',
        '#de': 'description',
        '#na': 'name',
        '#ct': 'category',
      },
      ExpressionAttributeValues: {
        ':ct': { S: category },
      },
    }, (error, data) => {
      if (error) {
        dispatch(applicationError(error))
      } else {
        const productList = []
        data.Items.forEach((item) => {
          productList.push({
            id: item.id.S,
            name: item.name.S,
            brand: item.brand.S,
            description: item.description.S,
          })
        })
        dispatch(showProductsInCategory(productList))
      }
    })
  }

export const clearProductsInCategory = () => ({
  type: types.CLEAR_PRODUCTS,
  products: null,
})

export const showProductById = product => ({
  type: types.SHOW_PRODUCT_BY_ID,
  product,
})

export const loadProductById = productId =>
  (dispatch, getState) => {
    const { dynamo } = getState().aws

    dynamo.getItem({
      AttributesToGet: [
        'brand',
        'description',
        'name',
        'id',
        'image',
      ],
      TableName: config.ProductCatalogTableName,
      Key: {
        id: { S: productId.toString() },
      },
    }, (error, data) => {
      if (error) {
        console.log('Error:', error)
        dispatch(applicationError(error))
      } else {
        const product = {
          brand: data.Item.brand.S,
          description: data.Item.description.S,
          name: data.Item.name.S,
          id: data.Item.id.S,
          image: `https://${data.Item.image.S}`,
        }

        dispatch(showProductById(product))
      }
    })
  }

export const clearProductById = () => ({
  type: types.CLEAR_PRODUCT_BY_ID,
})

export const registerPhotographerComplete = () => ({
  type: types.REGISTER_PHOTOGRAPHER,
})

export const registerPhotographer = (createdById, createdByName, phoneNumber) =>
  makeApiRequest(
    config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/user-info/update-phone/1-0-0',
      id: createdById,
      phone: phoneNumber,
      origin: `hello-retail/web-client-update-phone/${createdById}/${createdByName}`,
    }, registerPhotographerComplete,
  )

export const resetPhotographerRegistration = () => ({
  type: types.REGISTER_PHOTOGRAPHER_RESET,
})

export const buyProductComplete = product => ({
  type: types.BUY_PRODUCT_COMPLETE,
  product,
})

export const buyProduct = (product, purchasedById, purchasedByName) =>
  makeApiRequest(
    config.EventWriterApi, 'POST', '/event-writer/', {
      schema: 'com.nordstrom/product/purchase/1-0-0',
      id: product,
      origin: `hello-retail/web-client-purchase-product/${purchasedById}/${purchasedByName}`,
    }, () => {
      buyProductComplete(product)
    })
