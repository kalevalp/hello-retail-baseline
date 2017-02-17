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
  }

  writeKinesisEvent(data, partitionKey) {
    const envelopeEvent = impl.createEnvelopeEvent(data)

    const newProductCreatedEvent = {
      Data: JSON.stringify(envelopeEvent),
      PartitionKey: partitionKey,
      StreamName: process.env.STREAM_NAME,
    }

    console.log('PUTTING EVENT')

    this.kinesis.putRecord(newProductCreatedEvent, (err, ack) => {
      if (ack) {
        console.log(`K-PUT: ${JSON.stringify(ack)}`)
      }

      if (err) {
        console.log(JSON.stringify(err,null,2))
        throw new Error(err)
      }
    })
  }
}

module.exports = KinesisEventWriter
