'use strict';

const http = require('http');

exports.ProductSource = function ProductSource() {
  let productCache = [];
  let categoryList;
  let categoryIndex = 0;
  let productPage = 1;

  const nordstromStoreHost = 'shop.nordstrom.com';
  const siteMapPagePath = '/c/sitemap';

  function scrapeProductsFromCategoryPage(categoryInfo, pageIndex, callback) {
    fetchPageContent(nordstromStoreHost, categoryInfo.path + '?page=' + pageIndex, function(body) {
      const productRenderRegEx = /ProductResultsDesktop\.ProductResults,(.*)\),/g;

      //console.log(body);
      let matches = productRenderRegEx.exec(body);
      if(matches && matches.length > 1) {
        let products = JSON.parse(matches[1]);

        callback(products.data.ProductResult.ProductData);
      } else {
        callback({});
      }
    });
  }

  function fetchPageContent(host, path, callback) {
    //console.log({host,path});

    http.get({
      host,
      path,
    }, function(response) {
      let body = '';

      response.on('data', function(data) {
        body += data;
      });

      response.on('end', function() {
        callback(body);
      })
    })
  }

  function scrapeAllCategories(callback) {
    /*
     For the brand index page, the initial HTML response contains links to the individual brand pages.
     */

    fetchPageContent(nordstromStoreHost, siteMapPagePath, function (body) {
      // List of link "brands" which are not really brands.
      const nonCategories = [

      ];

      const codeRenderingProductsRegEx = /<a href="(http:[\/.a-zA-Z0-9\-]+)" title="(.+)"></g;
      const codeRenderingProductsRegExSingle = /<a href="http:\/\/shop.nordstrom.com([\/.a-zA-Z0-9\-]+)" title="(.+)"></;
      let linkMatches = body.match(codeRenderingProductsRegEx);
      let categories = [];

      linkMatches.forEach(function(link) {
        let linkResult = codeRenderingProductsRegExSingle.exec(link);
        let categoryPath = linkResult[1];
        let categoryName = linkResult[2]

        // Make sure this brand is not contained in the list of non-brands
        if(nonCategories.indexOf(categoryName) != -1) return;

        categories.push({
          name: categoryName,
          path: categoryPath,
        });
      });

      callback(categories);
    });
  }


  function loadMoreProducts(callback, category) {
    console.log('loading more products...');
    console.log(category)
    scrapeProductsFromCategoryPage(categoryList[categoryIndex], productPage, function(result) {
      if(Object.keys(result).length === 0) {
        // No products on this page, check next brand.
        categoryIndex++;
        productPage = 1;

        if(categoryIndex >= categoryList.length) {
          throw new Error(`Ran out of brands! ${categoryList.length} brands available.`);
        }

        loadMoreProducts(callback, categoryList[categoryIndex]);
      } else {
        console.log(Object.keys(result).length);
        productPage++;

        Object.keys(result).forEach(function(productId) {
          result[productId].category = category.name;
          productCache.push(result[productId]);
        });

        callback();
      }

    });
  }

  function nextProduct(callback) {
    updateBrands(function(listOfCategories) {
      if(!categoryList) {
        categoryList = listOfCategories;
      }

      if(productCache.length > 0) {
        callback(productCache.pop());
      } else {
        loadMoreProducts(function() {
          callback(productCache.pop());
        }, categoryList[categoryIndex]);
      }
    });
  }

  function updateBrands(callback) {

    if(!categoryList) {
      console.log('updatingBrands...')
      scrapeAllCategories(callback);
    } else {
      callback(categoryList);
    }
  }

  return {
    nextProduct
  };
}
