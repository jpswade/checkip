const xml2js = require('xml2js');
const fs = require('fs');

file = 'data/ipv4-address-space.xml';
data = fs.readFile(file);
outputFile = 'data/ipv4-address-space.json';
var parser = new xml2js.Parser();
fs.readFile(__dirname + '/' + file, function(err, data) {
    parser.parseString(data, function (err, result) {
        var json = JSON.stringify(result);
        fs.writeFile(outputFile, json, 'utf8', null);
    });
});
