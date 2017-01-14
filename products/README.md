# Hello-Retail

## Automated Product Producer

Scrapes the [http://shop.nordstrom.com](http://shop.nordstrom.com) website and writes `product/created` events to the
Retail Stream. The total time to spend scraping and how often to write a product to the stream are controlled
via the invoke event (Lambda payload), which take the form:
 
```JSON
{
  "productFrequency": 1000,
  "lambdaTimeout": 30000
}
```

Where `productFrequency` is the interval between writes of products to the Kinesis stream and `lambdaTimeout`
is the duration in milliseconds for which the process will run.

Currently, this project produces events using the [Retail Stream Envelope Schema](../retail-stream/retail-stream-schema-ingress.json) and for the `data` attribute, the [Product Creation Schema](product-create-schema.json).

A object template adhering to this schema:
```
{
    "schema": <url>,
    "origin": <string>,
    "timeOrigin": <datetime>,
    "data": {
        "schema": <url>,
        "id": <string>,
        "brand": <string>,
        "name": <string>,
        "description": <string>,
        "category": <string>
    }
}
```

An example object using that schema follows:
```
{
    "schema": "com.nordstrom/retail-stream/1-0-0",
    "origin": "hello-retail/product-producer-automation",
    "timeOrigin": "2017-01-12T18:29:25.144Z",
    "data": {
        "schema": "com.nordstrom/product/create/1-0-0",
        "id": "4579628",
        "brand": "TOPMAN",
        "name": "Topman Check Flannel Shirt",
        "description": "PAGE:/s/topman-check-flannel-shirt/4579628",
        "category": "Shirts for Men, Men's Shirts"
    }
}
```
