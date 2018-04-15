'use strict';

var https = require('https');

var options = {
    host: 'www.openligadb.de',
    path: '/api/getmatchdata/bl1/2017',
    headers: { 'User-Agent': 'request', 'Accept': 'application/json' }
};

module.exports = function GamesModel() {
    console.log('GamesModel');
    https.get(options, function (res) {
        var json = '';
        res.on('data', function (chunk) {
            json += chunk;
        });
        res.on('end', function () {
            if (res.statusCode === 200) {
                try {
                    var data = JSON.parse(json);
                    return data
                } catch (e) {
                    console.log('Error parsing JSON!');
                }
            } else {
                console.log('Status:', res.statusCode);
            }
        });
    }).on('error', function (err) {
          console.log('Error:', err);
    });
};
