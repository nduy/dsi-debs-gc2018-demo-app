const readline = require('readline');
const fs = require('fs');
const {MongoClient, ObjectID} = require('mongodb');
const moment = require('moment');

MongoClient.connect('mongodb://140.203.155.187:8023', (err, client) => {
  if (err) {
    return console.log('Unable to connect to MongoDB server');
  }
  
  const db = client.db('ShipTrajectory');
  const trajectoryCol = db.collection('trajectory');

  const dataPoints = [];

  const jsonStreamer = (filePath) => {
    // const filePath='./data/predicted_data_duy.json';
    // const filePath='../data/ShipGSON.json';

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
    });

    rl.on('line', (line) => {
      var obj = JSON.parse(line);
      
      var date = moment(obj.date, 'DD-MM-YY HH:mm').toDate();
      obj.date = date;

      var arrivalTime = moment(obj.arrivalTime, 'DD-MM-YY HH:mm').toDate();
      obj.arrivalTime = arrivalTime;

      dataPoints.push(obj);
    });

    rl.on('close', () => {
      const batchSize = 100;
      var count = 0;
      var finished = false;

      while (!finished) {
        var batch = [];
        for (var i = 0; i < batchSize; i++) {
          if (dataPoints[count * batchSize + i]) {
            batch.push(dataPoints[count * batchSize + i]);
          } else {
            finished = true;
            break;
          };
        }

        var done = false;
        trajectoryCol.insertMany(batch).then(()=> {
          console.log(`Insert batch number ${count} successfully batchSize = ${batch.length}`);
          done = true;
        }).catch(() => {
          console.log(`Insert batch number ${count} failed`);
        });
        require('deasync').loopWhile(function(){return !done;});
        count++;
      }

      
      client.close();
    })
  }

  jsonStreamer('./data/ShipGSON.json');
  // db.collection('Todos').insertOne({
  //   text: 'Something to do',
  //   completed: false
  // }, (err, result) => {
  //   if (err) {
  //     return console.log('Unable to insert todo', err);
  //   }
  //
  //   console.log(JSON.stringify(result.ops, undefined, 2));
  // });

  // Insert new doc into Users (name, age, location)
  // db.collection('Users').insertOne({
  //   name: 'Andrew',
  //   age: 25,
  //   location: 'Philadelphia'
  // }, (err, result) => {
  //   if (err) {
  //     return console.log('Unable to insert user', err);
  //   }
  //
  //   console.log(result.ops[0]._id.getTimestamp());
  // });

  
});
