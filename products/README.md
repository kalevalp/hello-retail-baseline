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
