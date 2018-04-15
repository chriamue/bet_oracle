'use strict';

var https = require('https');

exports.get = function (req, res) {
    var id = req.params.id.toString();
    var options = {
        host: 'www.openligadb.de',
        path: '/api/getmatchdata/' + id,
        headers: { 'User-Agent': 'request', 'Accept': 'application/json' }
    };

    https.get(options, function (res2) {
        var json = '';
        res2.on('data', function (chunk) {
            json += chunk;
        });
        res2.on('end', function () {
            if (res2.statusCode === 200) {
                try {
                    var data = JSON.parse(json);
                    //res.render('game', data);
                    console.log(data.Team1.TeamName)
                    var obj = {gameid: id, team1: data.Team1.TeamName, team2: data.Team2.TeamName, points1: data.MatchResults[1].PointsTeam1, points2: data.MatchResults[1].PointsTeam2}
                    res.render('game', obj);
                    //return res.status(200).send(obj)
                } catch (e) {
                    return res.status(500).send('Error parsing JSON!'+ e);
                }
            } else {
                return res.status(res2.statusCode).send('unknown error');
            }
        });
    }).on('error', function (err) {
        return res.status(500).send('Error:', err);
    });
};