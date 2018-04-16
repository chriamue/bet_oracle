'use strict';

var https = require('https');

var GameModel = require('../../models/game');

const generate_contract = function (id, obj, res) {
    GameModel.findOne({ id: id }, function (err, game) {
        if (err || !game) {
            game = new GameModel();
            game.id = id;
            game.team1 = obj.team1;
            game.team2 = obj.team2;
            game.time = new Date(obj.time);
            game.save(function (err) {
                if (err)
                    console.error('failed saving game ', err);
                console.log("saved: " + id);
                res.render('game', obj);
            });
        } else {
            if (!obj.paidoff)
                obj.contract = game.contract;
            else
                obj.contract = "Finished"
            res.render('game', obj);
        }
    });
}

const gamejson = function (id, data, res) {
    var points1 = "-";
    var points2 = "-";
    if (data.MatchResults.length > 0) {
        points1 = data.MatchResults[1].PointsTeam1;
        points2 = data.MatchResults[1].PointsTeam2;
    }
    var obj = {
        gameid: id, team1: data.Team1.TeamName, team2: data.Team2.TeamName,
        points1: points1, points2: points2,
        time: data.MatchDateTimeUTC,
        contract: "Generating"
    }
    generate_contract(id, obj, res)
}

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
                    gamejson(id, data, res);

                } catch (e) {
                    return res.status(500).send('Error parsing JSON!' + e);
                }
            } else {
                return res.status(res2.statusCode).send('unknown error');
            }
        });
    }).on('error', function (err) {
        return res.status(500).send('Error:', err);
    });
};