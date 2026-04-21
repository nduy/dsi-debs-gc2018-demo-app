var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI, { 
    useMongoClient: true,
    poolSize: 1000
 });

module.exports = {mongoose};

