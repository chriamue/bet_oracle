'use strict';

const config = require('./config');
const mongoose = require('mongoose');
const fs = require('fs');
const https = require('https');
const Web3 = require('web3');
const Solidity = require('solc');
var GameModel = require('./models/game');

var web3 = new Web3();
web3.setProvider(new Web3.providers.HttpProvider(config.etherHost));
var gasPrice = 1000000000;
web3.eth.getGasPrice(function (error, result) {
    console.log(error);
    gasPrice = result;
});
const contract_source = fs.readFileSync('./contracts/bet.sol', "utf8");
const compiled = Solidity.compile(contract_source, 1).contracts[':Bet'];
const contract_interface = compiled.interface;
const contract_bytecode = compiled.bytecode;

const fetch_game_data = function (id, callback) {
    var options = {
        host: 'www.openligadb.de',
        path: '/api/getmatchdata/' + id,
        headers: { 'User-Agent': 'request', 'Accept': 'application/json' }
    };

    https.get(options, function (res) {
        var json = '';
        res.on('data', function (chunk) {
            json += chunk;
        });
        res.on('end', function () {
            if (res.statusCode === 200) {
                try {
                    var data = JSON.parse(json);
                    callback(null, data);
                } catch (err) {
                    callback(err);
                }
            } else {
                callback('unknown error');
            }
        });
    }).on('error', function (err) {
        callback(err, null);
    });
}

var getGameResult = function (id, callback) {
    fetch_game_data(id, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            var p1 = data.MatchResults[1].PointsTeam1;
            var p2 = data.MatchResults[1].PointsTeam2;
            var results = { id: id, draw: true, won_team1: true };
            if (p1 === p2) {

            } else if (p1 > p2) {
                results.draw = false;
            } else {
                results.draw = false;
                results.won_team1 = false;
            }
            callback(err, results);
        }
    });
}

var findOutdatedContracts = function (callback) {
    var cutoff = new Date();
    cutoff.setTime(cutoff.getTime() + ((-5) * 60 * 60 * 1000));
    GameModel.find({ time: { $lt: cutoff }, paidoff: false }, function (err, games) {
        callback(err, games);
    });
}

var endContract = async function (contract, results, callback) {
    await web3.eth.personal.unlockAccount(config.etherAccount, config.etherPassword);
    var contract = new web3.eth.Contract(JSON.parse(contract_interface), contract);
    console.log(contract.methods.end);
    var result = await contract.methods.end(results.draw, results.won_team1).send({ from: config.etherAccount }, function (e, result) {
        callback(e, result);
    });
    await web3.eth.personal.lockAccount(config.etherAccount);
}

var oracle = function () {
    mongoose.connect(config.mongourl);
    findOutdatedContracts((err, games) => {
        if (err) {
            console.log(err);
        } else {
            for (var i in games) {
                console.log(games[i]);
                getGameResult(games[i].id, (err, results) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(results);
                        games[i].contract;
                        endContract(games[i].contract, results, (err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(result);
                            }
                        })
                    }
                });
            }
        }
    });
}

oracle();