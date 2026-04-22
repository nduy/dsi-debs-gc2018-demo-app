require('../config/config');

var kafka = require('kafka-node');

console.log('bkaddr =', process.env.KAFKA_BROKER_ADDRESSES);
console.log('topic = ', process.env.KAFKA_CONSUMER_TOPIC);

 var options = {
     kafkaHost: process.env.KAFKA_BROKER_ADDRESSES,
     zk: undefined,
     batch: undefined,
     ssl: true, 
     groupId: 'FlinkResultGroup', 
     fromOffset: 'latest', 
     outOfRangeOffset: 'earliest',
     migrateHLC: false, 
     migrateRolling: true
 }
 
 var consumerGroup = new kafka.ConsumerGroup(options, [process.env.KAFKA_CONSUMER_TOPIC]);

 module.exports = {consumerGroup};