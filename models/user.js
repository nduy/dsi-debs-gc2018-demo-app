var mongoose = require('mongoose');

var User = mongoose.model('User', {
    name:{ 
        type: String,
        required: true
    },
    lattitude: {
        type: Number,
        default: null
    },
    longtitude: {
        type: Number,
        default: null
    },
    altitude: {
        type: Number,
        default: null
    },
    atDateTime: {
        type: Date,
        default: null
    }
});

module.exports = {User};

