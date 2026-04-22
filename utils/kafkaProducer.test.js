var expect = require('expect');

var {produceMessage} = require('./kafkaProducer');

describe('ProduceMessageToKafka', () =>{ 
    it('should produce message to kafka successfully', (done) =>{
         var obj = {
            "_id":"5a3a7e3f301cb56a3a9f807d",
            "name":"000",
            "atDateTime":"2008-10-23T01:53:04.000Z",
            "altitude":492,
            "longtitude":116.321337,
            "lattitude":39.984702
        }
        var data = produceMessage(obj);

        expect(data).toBeA('JSON');
        done();
    });
});