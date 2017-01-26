'use strict';

class KinesisEventWriter {
  constructor(kinesis) {
    this.kinesis = kinesis;
  }

  writeKinesisEvent(data, partitionKey) {
    const envelopeEvent = KinesisEventWriter.envelopeEvent();
    envelopeEvent.data = data;

    const newProductCreatedEvent = {
      Data: JSON.stringify(envelopeEvent),
      PartitionKey: partitionKey,
      StreamName: process.env.STREAM_NAME,
    };

    this.kinesis.putRecord(newProductCreatedEvent, (err, ack) => {
      if (ack) {
        console.log(`K-PUT: ${JSON.stringify(ack)}`);
      }

      if (err) {
        throw new Error(err);
      }
    });
  }
}

KinesisEventWriter.envelopeEvent = () => ({
  schema: 'com.nordstrom/retail-stream-ingress/1-0-0',
  origin: 'hello-retail/product-scraper',
  timeOrigin: new Date().toISOString(),
});

module.exports = KinesisEventWriter;
