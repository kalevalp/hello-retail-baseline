/**
 {
  "schema": "com.nordstrom/product/create/1-0-0",
  "id": "2169651",
  "origin": "hello-retail/web-client-create-product/amzn1.account.AHMNGKVGNQYJUV7BZZZMFH3HP3KQ/Team Jetpack",
  "category": "C1",
  "name": "N2",
  "brand": "B2",
  "description": "D2"
 }
 */

const Chance = new require('chance')
const chance = new Chance()
console.log(chance)

const pickCategory = () => chance.pickone([
  "Men",
  "Women",
  "Kids",
  "Shoes",
  "Home"
])

exports.createRandomProduct = function(requestParams, context, ee, next) {
  requestParams.json = {
    schema: 'com.nordstrom/product/create/1-0-0',
    id: (`0000000${Math.floor(Math.abs(Math.random() * 10000000))}`).substr(-7),
    origin: 'hello-retail/web-client-create-product/amzn1.account.AHMNGKVGNQYJUV7BZZZMFH3HP3KQ/Team Jetpack',
    category: pickCategory(),
    name: chance.word({syllables: 3}),
    brand: chance.word({syllables: 2}),
    description: chance.paragraph()
  }

  console.log(requestParams.json)

  return next()
}
