require('../config/config');

const topic = process.env.KAFKA_PRODUCER_TOPIC;

var kafka = require('kafka-node');

var Producer = kafka.Producer;

var client = new kafka.KafkaClient({kafkaHost: process.env.KAFKA_BROKER_ADDRESSES});

var producer = new Producer(client);
var topicReady = false;

producer.on('ready', function () {
    console.log('Producer for topic ' + topic + ' is ready');
    topicReady = true;
 });
  
producer.on('error', function (err) {
  console.error('Problem with producing Kafka message '+ err);
});

var produceMessage = (rawMessage) => {
    KeyedMessage = kafka.KeyedMessage;
    var message = new KeyedMessage(null, JSON.stringify(rawMessage));
    var payloads = [
        {topic: topic, messages: message}
    ];
    if (topicReady) {
        producer.send(payloads, (err, data) => {
            if (err) {
                console.log('Error Producing message to Kafka ', err);
                return err;
            } else {
                console.log('Produced message to Kafka ', data);
                return data;
            } 
        });
    } else {
        console.log('Producer is not ready yet. Failed to send the message');
        return null;
    }
}

module.exports = {produceMessage};

 