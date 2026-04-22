var expect = require('expect');

var {generateMessage, generateLocationMessage} = require('./message');

describe('generateMessage', function(){
    it ('should genereate correct message object',function() {
        var from = 'Chan Le Van';
        var text = 'Test Message';
        var message = generateMessage(from, text);

        expect(message.createdAt).toBeA('number');
        expect(message).toInclude({
            from,
            text
        });
    });
});

describe('generateLocationMessage', function(){
    it('should generate correct location object', () => {
        var from = 'Chrome';
        var latitude = 15;
        var longtitude = 19;
        var url = 'https://www.google.com/maps?q=15,19';
        var message = generateLocationMessage(from, latitude, longtitude);

        expect(message.createdAt).toBeA('number');
        expect(message).toInclude({
            from, url});
    });
});