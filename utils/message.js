var generateMessage = function(from, text) {
    return {
        from: from, 
        text: text, 
        createdAt: new Date().getTime()
    }
};

var generateLocationMessage = (from, latitude, longtitude) => {
    return {
        from: from, 
        url: `https://www.google.com/maps?q=${latitude},${longtitude}`,
        createdAt: new Date().getTime()
    }
};

module.exports = {generateMessage, generateLocationMessage};