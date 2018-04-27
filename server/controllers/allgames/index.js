'use strict';

var https = require('https');

var options = {
    host: 'www.openligadb.de',
    path: '/api/getmatchdata/bl1/2017',
    headers: { 'User-Agent': 'request', 'Accept': 'application/json' }
};

exports.get = function (req, res) {
    https.get(options, function (res2) {
        var json = '';
        res2.on('data', function (chunk) {
            json += chunk;
        });
        res2.on('end', function () {
            if (res2.statusCode === 200) {
                try {
                    var data = JSON.parse(json);
                    var obj = { games: [] }
                    var current = new Date()
                    for (var game_index in data) {
                        var game = data[game_index]
                        var time = new Date(game.MatchDateTimeUTC)
                        obj.games.push({ gameid: game.MatchID, team1: game.Team1.TeamName, team2: game.Team2.TeamName, time: game.MatchDateTimeUTC })
                    }
                    res.render('games', obj);
                } catch (e) {
                    return res.status(500).send('Error parsing JSON!');
                }
            } else {
                return res.status(res2.statusCode).send('unknown error');
            }
        });
    }).on('error', function (err) {
        return res.status(500).send('Error:', err);
    });
};