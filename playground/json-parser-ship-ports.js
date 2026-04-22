const csv = require('csvtojson');
const fs = require('fs');
portInfo = {};

csv()
.fromFile('./data/ports.csv')
.on('json', (obj) => {
    portInfo[obj.PORT_NAME.replace(/[']/g, '').trim()] = {
        lon: parseFloat(obj.LON),
        lat: parseFloat(obj.LAT),
        radius: parseFloat(obj.RADIUS)
    }
})
.on('done', () => {
    console.log(portInfo);
    fs.writeFileSync('ports-in-json.json', JSON.stringify(portInfo), () => {
        console.log('Done write to file');
    })
});