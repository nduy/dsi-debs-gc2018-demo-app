const max_longitude = 37.5;
const min_longitude = -6.5;
const max_latitude = 45.5;
const min_latitude = 31.0;

const n_longitude_cells = 440;
const n_latitude_cells = 145;

const delta_longitude = (max_longitude - min_longitude)/n_longitude_cells;
const delta_latitude = (max_latitude - min_latitude)/n_latitude_cells;


decodeHexStrs = function(hexStr) {
    const prefix = '0x';

    const index1 = hexStr.indexOf(prefix);
    const index2 = hexStr.indexOf(prefix, index1 + 1);

    const hex1 = hexStr.substring(index1, index2);//.replace(prefix, '');
    const hex2 = hexStr.substring(index2, hexStr.length);//.replace(prefix, '');
    
    const lng_cell = parseInt(hex1, 16);
    const lat_cell = parseInt(hex2, 16);

    const lng =  lng_cell*delta_longitude + min_longitude+0.5*delta_longitude;
    const lat =  lat_cell*delta_latitude + min_latitude+0.5*delta_latitude;

    return {
        lon: lng, 
        lat: lat
    }
}

module.exports = {
    decodeHexStrs
};

