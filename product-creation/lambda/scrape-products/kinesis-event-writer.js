'use strict'

const impl = {
  createEnvelopeEvent: data => ({
    schema: 'com.nordstrom/retail-stream-ingress/1-0-0',
    origin: 'hello-retail/product-scraper',
    timeOrigin: new Date().toISOString(),
    data,
  }),
}

class KinesisEventWriter {
  constructor(kinesis) {
    this.kinesis = kinesis
    this.writeKinesisEvent = this.writeKinesisEvent.bind(this)
  }

  writeKinesisEvent(data, partitionKey) {
    const writer = this
    const envelopeEvent = impl.createEnvelopeEvent(data)

    const newProductCreatedEvent = {
      Data: JSON.stringify(envelopeEvent),
      PartitionKey: partitionKey,
      StreamName: process.env.STREAM_NAME,
    }

    let promise = new Promise(function(resolve, reject) {
      writer.kinesis.putRecord(newProductCreatedEvent, (err, ack) => {
        if (ack) {
          console.log(`K-PUT: ${JSON.stringify(ack)}`)
          resolve(ack)
        }

        if (err) {
          console.error(JSON.stringify(err,null,2))
          reject(err)
        }
      })
    })

    console.log(promise)

    return promise;
  }
}

module.exports = KinesisEventWriter
