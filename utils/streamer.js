'use strict';

const fs = require('fs');
const csv = require('csvtojson');
const ports = require('../data/ports-in-json.json');
const {decodeHexStrs} = require('./decode-long-lat-hex.js');
const moment = require('moment');
var smooth = require('chaikin-smooth')

function cleanData(arr) {
    // arr.map((e) => {
    //     console.log(e.shipId + ' ' + e.date + ' ' + e.lat + ' ' + e.lon);
    // });

    var result = [];
    for (var i = 0; i < arr.length; i++) {
        const point = arr[i];
        var predictions = point.predictions;
        if (predictions === null) {
            predictions = [];
        }

        var cleanedPrediction = [];

        for (var j = 0; j < predictions.length; j++) {
            const p = predictions[j];
            //const coords = decode(p.tgt);
            const coords = decodep(p,point.lon, point.lat);
            var obj = {
                pred_dest: p.pred_dest,
                tgt: coords,
                lineWeight: 2
            };

            if (p.pred_dest === point.bestDest) {
                obj.lineWeight = 4;
            }
            cleanedPrediction.push(obj);
        }

        result.push({
            src: {
                shipId: point.shipId,
                shipType: point.shipType,
                speed: point.speed,
                lon: point.lon,
                lat: point.lat,
                course: point.course, 
                heading: point.heading, 
                departurePortName: point.departurePortName, 
            },
            des: { 
                routes: cleanedPrediction,
                arrivalTime: point.arrivalTime,
                bestDest: point.bestDest
            }
        });
    }
    return result;
}


function decode(tgt) {
    const result = [];
    const elms = tgt.replace(/[.]/g, '').trim().split(' ');
    if (elms.length === 0) {
        console.log('tgt length = 0');
    } else {
        var raw_coord = [];
        for (let idx = 0; idx < elms.length - 1; idx++) {
            let coord = decodeHexStrs(elms[idx].replace(/[']/g,''));
            raw_coord.push([coord.lon, coord.lat]);
            //result.push(coord);
        }
        //console.log(raw_coord);
        var smoothed_coord =smooth(smooth(smooth(raw_coord))); // Smooth the lines
        for (let idx = 0; idx < smoothed_coord.length ; idx++) {
            result.push({'lon': smoothed_coord[idx][0], 'lat': smoothed_coord[idx][1]});
        }
        
        const lastPort = elms[elms.length - 1].replace(/[_]/g, ' ').trim();
        // console.log(ports);
        const lastCoord  = ports[lastPort];
        result.push(lastCoord);
    }
    if (result.length === 0) {
        console.log('decode tgt = 0 in length');
    }
    
    // console.log(tgt);
    
    return result;
}

function decodep(p,lon,lat) {
    const result = [];
    //console.log(p);
    const elms = p.tgt.replace(/[.]/g, '').trim().split(' ');
    if (elms.length === 0) {
        console.log('tgt length = 0');
    } else {
        var raw_coord = [[lon,lat]];
        for (let idx = 0; idx < elms.length - 1; idx++) {
            let coord = decodeHexStrs(elms[idx].replace(/[']/g,''));
            raw_coord.push([coord.lon, coord.lat]);
            //result.push(coord);
        }
        //console.log(raw_coord);
        var smoothed_coord =smooth(smooth(smooth(raw_coord))); // Smooth the lines
        for (let idx = 0; idx < smoothed_coord.length ; idx++) {
            result.push({'lon': smoothed_coord[idx][0], 'lat': smoothed_coord[idx][1]});
        }
        
        const lastPort = elms[elms.length - 1].replace(/[_]/g, ' ').trim();
        // console.log(ports);
        const lastCoord  = ports[lastPort];
        result.push(lastCoord);
    }
    if (result.length === 0) {
        console.log('decode tgt = 0 in length');
    }
    
    // console.log(tgt);
    
    return result;
}

const jsonStreamer = (io, streamRate) => {
    const filePath='./data/predicted_data_duy.json';
    // const filePath='./data/ShipGSON.json';
    
    const readline = require('readline');
    const fs = require('fs');
    var datapoints = [];
    const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    });

    rl.on('line', (line) => {
        datapoints.push(JSON.parse(line));
    });

    rl.on('close', () => {
        // console.log('----------------');
        //console.log(datapoints);
        const cleanedData = cleanData(datapoints);
        //console.log(cleanedData);
        let i = 0;

        var intervalId = setInterval(() => {
            //console.log('----------------');
            //console.log(cleanedData);
            io.emit('ship-data', cleanedData[i]);
            // console.log(cleanedData[i].des.routes[0].tgt);
            i++;
            if (i === cleanedData.length - 1) {
                clearInterval(intervalId);
            //    io.emit('done-streaming');
            }
        }, streamRate);
    });
}

const startStream = (docs, io, streamRate) => {
    return new Promise((resolve, reject) => {
        const cleanedData = cleanData(docs);
        var i = 0;

        var intervalId = setInterval(() => {
            // console.log('----------------');
            io.emit('ship-data', cleanedData[i]);
            // console.log(cleanedData[i].des.routes[0].tgt);
            //console.log(i, cleanedData[i].src.lat,cleanedData[i].src.lon);
            i++;
            if (i === cleanedData.length - 1) {
                clearInterval(intervalId);
                resolve();
            //    io.emit('done-streaming');
            }
        }, streamRate);
    });
}

const fromDbStreamer = (io, dbClient, streamRate,singleShip) => {
    // const sampleShips = ["0x3f925_09-04-15 4:xx",
    //                      "0x7086e_11-05-15 3:xx", 
    //                      "0x0e26c_09-04-15 6:xx", 
    //                      "0x7086e_22-03-15 6:xx", 
    //                      "0x6d679_27-04-15 16:xx", 
    //                      "0xc35c9_10-03-15 12:xx", 
    //                      "0xb633e_20-04-15 0:xx", 
    //                      "0x7086e_08-05-15 23:xx", 
    //                      "0x3f925_27-03-15 9:xx", 
    //                      "0xe4728_09-04-15 0:xx"];
    // const sampleShips = ["0xc35c9_03-04-15 16:xx", "0x0e26c_13-04-15 2:xx", "0xc35c9_18-03-15 8:xx", "0xc35c9_17-04-15 16:xx", "0x6d679_02-05-15 19:xx", "0xf0454_03-05-15 7:xx", "0xe4728_27-03-15 7:xx", "0x0e26c_10-04-15 20:xx", "0x6cafd_17-04-15 15:xx", "0xb633e_01-05-15 1:xx"];
    // const sampleShips = ["0xc35c9_23-04-15 16:xx", "0x7086e_07-04-15 2:xx", "0x7086e_18-03-15 9:xx", "0x53db5_16-04-15 12:xx", "0xb633e_08-04-15 23:xx", "0xf0454_21-03-15 11:xx", "0x9c814_02-05-15 16:xx", "0xec4e1_04-05-15 7:xx", "0x9c814_27-04-15 3:xx", "0x9c814_05-05-15 13:xx", "0x9c814_03-05-15 19:xx", "0x9c814_09-05-15 3:xx", "0x9c814_08-05-15 20:xx", "0x013a2_20-04-15 17:xx", "0x013a2_03-05-15 5:xx", "0xf5796_20-04-15 19:xx", "0x2c277_22-04-15 5:xx", "0x43a61_12-05-15 15:xx", "0x2c277_04-05-15 10:xx", "0xe4125_26-04-15 20:xx"];
    // const sampleShips = ["0xe4125_23-04-15 1:xx", "0xe4125_27-04-15 12:xx", "0xe4125_06-05-15 15:xx", "0xe4125_13-05-15 20:xx", "0xe4125_29-04-15 14:xx", "0xfb128_23-04-15 6:xx", "0x29939_05-05-15 9:xx", "0x3c524_15-04-15 15:xx", "0xec4e1_02-05-15 10:xx", "0xbc56a_29-04-15 10:xx", "0xfb128_29-04-15 7:xx", "0x9c56e_24-04-15 9:xx", "0xec4e1_14-04-15 10:xx", "0xc49c8_25-04-15 13:xx", "0xec4e1_30-04-15 9:xx", "0xec4e1_23-04-15 9:xx", "0xc49c8_24-04-15 4:xx", "0xbb035_05-05-15 5:xx", "0x8f095_25-04-15 13:xx", "0xc5890_30-04-15 14:xx", "0xb2493_25-04-15 9:xx", "0x2fcc7_28-04-15 9:xx", "0xc5890_25-04-15 13:xx", "0x51727_25-04-15 20:xx", "0x2fcc7_30-04-15 14:xx", "0x00e22_26-04-15 19:xx", "0xc933d_27-04-15 21:xx", "0xc933d_27-04-15 10:xx", "0xd1e34_24-04-15 13:xx", "0x574e3_17-04-15 10:xx", "0x574e3_12-04-15 13:xx", "0xc933d_30-04-15 9:xx", "0xc933d_30-04-15 20:xx", "0xf9f91_16-04-15 20:xx", "0x3c524_25-04-15 0:xx", "0x82014_01-05-15 13:xx", "0xf151d_28-04-15 18:xx", "0x1778d_11-05-15 10:xx", "0x82014_02-05-15 5:xx", "0x82014_02-05-15 6:xx", "0x82014_03-05-15 13:xx", "0x82014_08-05-15 8:xx", "0x3c524_25-04-15 11:xx", "0x3b70f_28-04-15 4:xx", "0x62eae_28-04-15 11:xx", "0xc29a1_28-04-15 5:xx", "0xc49c8_22-04-15 10:xx", "0x336a7_02-05-15 23:xx", "0xec0a1_29-04-15 19:xx", "0x9c814_30-04-15 17:xx"];
    // const sampleShips = ["0x9c814_28-04-15 3:xx", "0x6795c_28-04-15 13:xx", "0x0e26c_06-05-15 4:xx", "0xccfc6_09-04-15 13:xx", "0x0e26c_05-05-15 2:xx", "0x0e26c_19-04-15 5:xx", "0xc49c8_20-04-15 15:xx", "0x82014_06-05-15 14:xx", "0x1d7d9_28-04-15 19:xx", "0xfe4a5_02-05-15 13:xx", "0xfe4a5_04-05-15 14:xx", "0xfe4a5_07-05-15 20:xx", "0xfe4a5_08-05-15 6:xx", "0xc90b5_29-04-15 7:xx", "0xfe4a5_10-05-15 13:xx", "0xc90b5_29-04-15 23:xx", "0xc49c8_11-04-15 18:xx", "0x0e26c_15-04-15 3:xx", "0xa2160_29-04-15 8:xx", "0xc49c8_20-04-15 3:xx", "0x0e26c_17-04-15 4:xx", "0xccfc6_11-04-15 9:xx", "0xcfe58_04-05-15 9:xx", "0x574e3_17-04-15 8:xx", "0x574e3_24-04-15 8:xx", "0x574e3_17-04-15 11:xx", "0x574e3_18-05-15 9:xx", "0xf9f91_05-05-15 7:xx", "0x0e26c_09-04-15 23:xx", "0xc49c8_10-04-15 14:xx", "0xb633e_18-03-15 6:xx", "0x37e20_02-05-15 17:xx", "0xbd205_14-05-15 12:xx", "0x4bf19_04-05-15 18:xx", "0x9d65a_30-04-15 5:xx", "0x2a53b_09-05-15 16:xx", "0xbd103_30-04-15 11:xx", "0x1778d_27-04-15 18:xx", "0x8f28c_30-04-15 13:xx", "0xa2160_30-04-15 5:xx", "0x1c02e_04-05-15 9:xx", "0x8f28c_16-05-15 0:xx", "0x24ff8_03-05-15 18:xx", "0x1c02e_04-05-15 16:xx", "0x24ff8_04-05-15 11:xx", "0x8df7b_04-05-15 7:xx", "0x7f3c6_30-04-15 17:xx", "0x285c6_30-04-15 17:xx", "0x28eec_01-05-15 11:xx", "0x285c6_02-05-15 14:xx"];
    // const sampleShips = ["0x285c6_03-05-15 16:xx", "0x28eec_14-05-15 19:xx", "0xf5d16_04-05-15 3:xx", "0xb3757_12-05-15 16:xx", "0x5be05_03-05-15 23:xx", "0x5be05_04-05-15 5:xx", "0x54cf2_30-04-15 19:xx", "0xd81ca_30-04-15 19:xx", "0x76848_30-04-15 20:xx", "0x76848_04-05-15 3:xx", "0xec0a1_03-05-15 16:xx", "0xce279_01-05-15 10:xx", "0x6795c_02-05-15 6:xx", "0x2b5f1_01-05-15 6:xx", "0x2b5f1_07-05-15 10:xx", "0x2b5f1_13-05-15 6:xx", "0x0e26c_16-04-15 21:xx", "0xebb33_04-05-15 11:xx", "0x347cf_18-04-15 16:xx", "0x24ff8_04-05-15 6:xx", "0xddc7d_01-05-15 15:xx", "0x96877_01-05-15 13:xx", "0x54c42_01-05-15 17:xx", "0x96877_05-05-15 3:xx", "0x1357c_04-05-15 9:xx", "0xf37bb_08-05-15 3:xx", "0x019d2_12-05-15 3:xx", "0xa4556_02-05-15 5:xx", "0x8becf_02-05-15 6:xx", "0xa4556_15-05-15 15:xx", "0x05091_06-05-15 15:xx", "0x31535_02-05-15 9:xx", "0x8becf_05-05-15 20:xx", "0x4a64b_03-05-15 21:xx", "0x1dbc4_04-05-15 17:xx", "0x1dbc4_07-05-15 2:xx", "0xa5bb5_16-05-15 8:xx", "0x401fe_02-05-15 15:xx", "0x2b9b5_29-04-15 12:xx", "0x8df7b_29-04-15 18:xx", "0x1a438_16-05-15 10:xx", "0x8df7b_02-05-15 6:xx", "0xe2264_06-05-15 12:xx", "0x0bf95_12-05-15 2:xx", "0x1dbf8_04-05-15 10:xx", "0xbd205_29-04-15 22:xx", "0xbd205_30-04-15 12:xx", "0x574e3_18-05-15 7:xx", "0x3c524_29-04-15 17:xx", "0xbc56a_16-04-15 6:xx"];
    // const sampleShips = ["0x63cc2_03-05-15 0:xx", "0xf9f91_13-04-15 6:xx", "0x972b2_03-05-15 6:xx", "0x972b2_06-05-15 10:xx", "0x63cc2_12-05-15 14:xx", "0xbd205_06-05-15 22:xx", "0xe2e17_04-05-15 22:xx", "0xe476c_03-05-15 8:xx", "0xbd0c0_03-05-15 7:xx", "0xdb152_03-05-15 13:xx", "0xdb152_18-05-15 6:xx", "0x26c89_05-05-15 14:xx", "0x99811_07-05-15 10:xx", "0x01550_08-05-15 16:xx", "0x02a96_03-05-15 19:xx", "0x50720_08-05-15 12:xx", "0x9cd3e_03-05-15 22:xx", "0x9cd3e_05-05-15 9:xx", "0x9cd3e_05-05-15 14:xx", "0x4d78f_10-05-15 18:xx", "0x91aa6_04-05-15 4:xx", "0x58b26_05-05-15 9:xx", "0xf5d16_03-05-15 22:xx", "0x58b26_06-05-15 8:xx", "0x1378d_04-05-15 16:xx", "0xb1a3c_04-05-15 13:xx", "0xdba39_04-05-15 13:xx", "0x648df_13-05-15 13:xx", "0x972b2_06-05-15 15:xx", "0x648df_14-05-15 14:xx", "0xc933d_29-04-15 21:xx", "0x0d49a_03-05-15 10:xx", "0x225ea_06-05-15 15:xx", "0x225ea_04-05-15 19:xx", "0x225ea_06-05-15 7:xx", "0x89472_04-05-15 21:xx", "0xb2548_09-05-15 7:xx", "0xdf15e_04-05-15 22:xx", "0xa96da_05-05-15 2:xx", "0xf5a9f_05-05-15 12:xx", "0xd0d76_06-05-15 0:xx", "0x5f5de_08-05-15 19:xx", "0x8d42d_05-05-15 14:xx", "0xc641a_05-05-15 16:xx", "0x10bca_05-05-15 17:xx", "0x58b26_04-05-15 10:xx", "0xcfdd5_05-05-15 18:xx", "0x46765_08-05-15 17:xx", "0xf10a8_07-05-15 9:xx", "0x4925b_09-05-15 16:xx"]
    //the number of ships we want to visualize
    // const sampleShips = ['0xc933d_30-04-15 9:xx', 
    //                      '0xe4125_13-05-15 20:xx',
    //                      '0x37e20_02-05-15 17:xx',
    //                      '0xdf15e_04-05-15 22:xx',
    //                      '0x58b26_06-05-15 8:xx', 
    //                      '0x9cd3e_03-05-15 22:xx',
    //                      '0x8d42d_05-05-15 14:xx',
    //                      '0x648df_13-05-15 13:xx',
    //                      '0xf5a9f_05-05-15 12:xx'];
    
//    const sampleShips = ['0x42ac9151d1897ae376c8367fb8978852d16e9fdd', '0xe9ceace3cf6678bfb3941ad30ef950b1b230915d', '0x3b1dc5f33a03b8bfc67338fe36adcb660da2edac'];

   // const sampleShips = ["0xd73544f705566d620e2606a706a8c542ef1517ed"];

    const sampleShips = [//'0x051ae778ac823021b0a72a2927f434fe90cd9a3f', //2 stops
// X                       '0x09da173d5baf5ac2695bfe6e03aceff7b64424b6',
// X                           '0x2a1b4874f255d0b1098ea465157a06ed8584c851',
// 3 Bad                           '0x300a261ba5a958a99e47a0d0afa6ab1e3d1cecca',
// 0 Bad                              '0x3b1dc5f33a03b8bfc67338fe36adcb660da2edac',
// 0 Bad                          '0x4223490c9c668f3a8bf7f3dc67004214f6f776cd',
'0xd73544f705566d620e2606a706a8c542ef1517ed', 
                               '0xe68f067c26be4114f9fe38de236fc6cda41d0cb2',
                               '0x42ac9151d1897ae376c8367fb8978852d16e9fdd',
// 0                           '0x6e6bd620ae7ea9b2dccd5fa5f3018d1c87ca4737',
                               '0x6f113ccc011c118192321f75fd1e6a0e4e09ba8d',
// 3                           '0x7f07483d084ff6b27c515ebeea7bf187041d4c91',
// 1                           '0x82789d6a3b005f9791085d30f28282ca709e71a1',
// 6                           '0x8bdcfb052cea1ebf79ca08d3e7b875cb704ce507',
                               '0x8c455e7ec07cc9778d427382bd40e9354bce7431',
// 5                           '0x97b7bd69ff5906d07fbf154ff00f9acee406fd46',
// 0                           '0x9d3bbc0eef1ebb5f321e4b589ecedcdf65f9239c',
// 1                           '0xa67ad18fd4a1ff9ec5c7ca116e8a627fbf5f0e14',
// 6                           '0xb5e4e656dddc530a5cad0bf6b92292356e5d6ae6',
// 0                           '0xb6076933c6f0adcef4b0f472b2c48ffa52ff894a',
// 5                           '0xbf5c365643465645bf1b2aef5a46984b4d78d3e3',
// 2                           '0xc65ba847eec17706c8ea366c9243542a8afb2c9b',
// 0                           '0xc909433a9220c8e23a9fe6024a7a1294f4ebc4da',
// 7                           '0xc9cd72eec39423d261e35432c5f75939c71be151',
// 6                           '0xd211c926fe1cd2a9a640737c63eb1f0923675b3a',
                               '0xd2ae158cbb238581609eee30423a2dbedf32a51a',

// 0                           '0xe9ceace3cf6678bfb3941ad30ef950b1b230915d',
// 0                           '0xfba824555e0bdd8f22bed04f17fc2ba79bded4f5',
// 7                          '0xfcc84a2b98905e588b45b1f1539fd4c454e10944'
    ]

   const db = dbClient.db('ShipTrajectory');
    const collection = db.collection('trajectory');

    var allPromises = [];
    // console.log("!!!!!!!!!!!!!!!!!!!!!");
    //with each ship id, we query its trajectory
    for (var idx = 0; idx < sampleShips.length; idx++) {
        const shipId = sampleShips[idx];

        // const arr = collection.find({ "$query": {'shipId': shipId}, "$orderby": { 'date' : 1 } }).toArray().then((docs) => {
        //     startStream(docs, io, streamRate);
        const arr = collection.find({'shipId': shipId}).sort({'date':1}).toArray().then((docs) => {
                startStream(docs, io, streamRate);
            
            //allPromises.push();

        }).catch((err) => {
            console.log(`err = ${err}`);
        });
        // Show only the first ship
        if (singleShip == 2){
            //console.log(singleShip + "!!!!!!!!!!!!!!!!!!!!!");
            break
        }
    }
    
    // Promise.all(allPromises).then(() => {
    //     console.log(allPromises);
    //     io.emit('done-streaming');
    //     console.log('notified client streaming has been done!');
    // }).catch((err)=>{
    //     console.log(err);
    // });
};

var result = decode("0x1290x36 0x12d0x3b 0x12d0x3c 0x12d0x3d 0x12d0x3e 0x12e0x3e 0x12e0x3f 0x12e0x40 0x12e0x41 0x12e0x42 0x12e0x43 0x12d0x43 0x12d0x44 0x12d0x45 0x12c0x45 PIRAEUS .");
// console.log(result);

module.exports = {jsonStreamer, fromDbStreamer};