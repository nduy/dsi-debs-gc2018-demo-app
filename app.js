'use strict';
require('./config/config');
const {jsonStreamer, fromDbStreamer} = require('./utils/streamer');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const _ = require('lodash');
const argv = require('yargs').argv;
const port = process.env.PORT;
var dbClient = null;

const {MongoClient} = require('mongodb');

const app = express();

app.use(express.static(path.join(__dirname, '/public')));

app.use(bodyParser.json());


const http = require('http');
const httpServer = http.createServer(app);

const io = require('socket.io')(httpServer);

app.post('/start', (req, res) => {
    var streamRate = req.body.streamRate;
    var singleShipOnly =  req.body.singleShipOnly;
    // console.log(singleShipOnly);
    // document.getElementById('single-ship-box').nodeValue();
    if (streamRate) {
        fromDbStreamer(io, dbClient, streamRate,singleShipOnly);
        // jsonStreamer(io, streamRate);

        res.status(200).send('Received stream rate ');
    } else {
        res.status(400).send();
    }
});

app.get('/ships-info', (req, res) => {
    const db = dbClient.db('ShipTrajectory');
    const collection = db.collection('trajectory');
    
    collection.distinct('shipId').then((docs) => {
        var ships = [];
        for (var i = 0; i < docs.length; i++) {
            ships.push(docs[i]);
            console.log(docs[i]);
        }
        res.status(200).send(ships);
    }).catch((err) => {
        console.log(err);
    });
});

io.on('connection', (socket) => {
    console.log('New user connected');
});


MongoClient.connect(process.env.MONGODB_URI, (err, client) => {
    if (err) {
      return console.log('Unable to connect to MongoDB server. Not able to start http server');
    } else {
        httpServer.listen(port, () => {
            console.log('Server is up on port:' + port);
            dbClient = client;
        });
    }
});
  
