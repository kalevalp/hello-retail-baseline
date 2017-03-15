# Hello-Retail

## Produce a single buy event

Currently, this project produces events using the [Retail Stream Envelope Schema](../retail-stream/retail-stream-schema-ingress.json) and for the `data` attribute, the [Product Purchase Schema](product-purchase-schema.json).

A object template adhering to this schema:
```
{
    "schema": <url>,
    "origin": <string>,
    "timeOrigin": <datetime>,
    "data": {
        "schema": <url>,
        "id": <string>
    }
}
```
*Note that there is no quantity field for buying more than one of the item.*

An example object using that schema follows:
```
{
    "schema": "com.nordstrom/retail-stream/1-0-0",
    "origin": "hello-retail/product-customer-purchase",
    "timeOrigin": "2017-01-12T18:29:25.144Z",
    "data": {
        "schema": "com.nordstrom/product/purchase/1-0-0",
        "id": "4579628"
    }
}
```
