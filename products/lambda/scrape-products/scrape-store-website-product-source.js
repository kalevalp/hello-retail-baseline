'use strict'

const http = require('http')

module.exports = function ProductSource() {
  const nordstromStoreHost = 'shop.nordstrom.com'
  const siteMapPagePath = '/c/sitemap'
  const productCache = []

  let categoryList
  let categoryIndex = 0
  let productPage = 1

  function fetchPageContent(host, path, callback) {
    http.get({
      host,
      path,
    }, (response) => {
      let body = ''

      response.on('data', (data) => {
        body += data
      })

      response.on('end', () => {
        callback(body)
      })
    })
  }

  function scrapeProductsFromCategoryPage(categoryInfo, pageIndex, callback) {
    fetchPageContent(nordstromStoreHost, `${categoryInfo.path}?page=${pageIndex}`, (body) => {
      const productRenderRegEx = /ProductResultsDesktop\.ProductResults,(.*)\),/g

      const matches = productRenderRegEx.exec(body)
      if (matches && matches.length > 1) {
        const products = JSON.parse(matches[1])

        callback(products.data.ProductResult.ProductData)
      } else {
        callback({})
      }
    })
  }

  function scrapeAllCategories(callback) {
    fetchPageContent(nordstromStoreHost, siteMapPagePath, (body) => {
      const nonCategories = []
      /* eslint no-useless-escape: 0 */
      const codeRenderingProductsRegEx = /<a href="(http:[\/.a-zA-Z0-9\-]+)" title="(.+)"></g
      const codeRenderingProductsRegExSingle =
        /<a href="http:\/\/shop.nordstrom.com([\/.a-zA-Z0-9\-]+)" title="(.+)"></
      /* eslint no-useless-escape: 0 */
      const linkMatches = body.match(codeRenderingProductsRegEx)
      const categories = []

      linkMatches.forEach((link) => {
        const linkResult = codeRenderingProductsRegExSingle.exec(link)
        const categoryPath = linkResult[1]
        const categoryName = linkResult[2]

        // Make sure this brand is not contained in the list of non-brands
        if (nonCategories.indexOf(categoryName) !== -1) return

        categories.push({
          name: categoryName,
          path: categoryPath,
        })
      })

      callback(categories)
    })
  }


  function loadMoreProducts(callback, category) {
    console.log(`${Date.now()} loading more products for ${category.name}...`)

    scrapeProductsFromCategoryPage(categoryList[categoryIndex], productPage, (result) => {
      if (Object.keys(result).length === 0) {
        // No products on this page, check next brand.
        categoryIndex += 1
        productPage = 1

        if (categoryIndex >= categoryList.length) {
          throw new Error(`Ran out of categories! ${categoryList.length} categories processed total.`)
        }

        loadMoreProducts(callback, categoryList[categoryIndex])
      } else {
        productPage += 1

        Object.keys(result).forEach((productId) => {
          result[productId].category = category.name // eslint-disable-line no-param-reassign
          productCache.push(result[productId])
        })

        callback()
      }
    })
  }

  function updateCategories(callback) {
    if (!categoryList) {
      console.log(`${Date.now()} Updating category list...`)
      scrapeAllCategories(callback)
    } else {
      callback(categoryList)
    }
  }

  this.nextProduct = function nextProduct(callback) {
    updateCategories((listOfCategories) => {
      if (!categoryList) {
        categoryList = listOfCategories
      }

      if (productCache.length > 0) {
        callback(productCache.pop())
      } else {
        loadMoreProducts(() => {
          callback(productCache.pop())
        }, categoryList[categoryIndex])
      }
    })
  }
}
