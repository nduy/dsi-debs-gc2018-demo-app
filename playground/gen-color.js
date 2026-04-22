const fs = require('fs');

function generateRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  

for (var i = 0; i < 1000; i++) {
    var color = generateRandomColor();
    fs.appendFileSync('color.txt', color + '\',\'');
}