'use strict';

const https = require('https');
const config = require('../../config');
const fs = require('fs');
const Web3 = require('web3')
const Solidity = require('solc')
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

var deploy = async function (callback) {
    console.log('deploying ...')
    await web3.eth.personal.unlockAccount(config.etherAccount, config.etherPassword);

    var contract = new web3.eth.Contract(JSON.parse(contract_interface));
    console.log('contract');
    var contractDeploy = await contract.deploy({
        data: '0x' + contract_bytecode,
        arguments: [10, 1]
    });
    var gasEstimated = 0;

    await contractDeploy.estimateGas(function (err, gas) {
        gasEstimated = gas;
    });
    var contractAddress;
    console.log(gasEstimated);
    await
        contractDeploy.send({
            from: config.etherAccount,
            gas: gasEstimated,
            gasPrice: gasPrice
        }, function (error, transactionHash) { console.log(error) })
            .on('error', function (error) { console.log(error) })
            .on('transactionHash', function (transactionHash) { })
            .on('receipt', function (receipt) {
                console.log(receipt.contractAddress) // contains the new contract address
            })
            .on('confirmation', function (confirmationNumber, receipt) {
                //console.log(receipt) 
            })
            .then(function (newContractInstance) {
                contractAddress = newContractInstance.options.address;
                console.log(newContractInstance.options.address); // instance with the new contract address
            });

    console.log(contractAddress);
    console.log('deployed!');
    await web3.eth.personal.lockAccount(config.etherAccount);
    console.log(contractAddress);
    return contractAddress;
};


var GameModel = require('../../models/game');


const load_game_object = function (id, callback) {
    GameModel.findOne({ id: id }, (err, game) => {
        if (err) {
            callback(err, null);
        } else if (!game) {
            callback('game not found', null);
        } else {
            callback(null, game);
        }
    });
}

const deploy_contract = async function (id, obj, callback) {
    var contract = await deploy().catch((error) => {
        assert.isNotOk(error, 'Promise error');
        done();
    });
    callback(null, contract);
}

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

const store_contract = function (obj, contract, callback) {
    console.log('store contract');
    var game = new GameModel();
    game.id = obj.gameid;
    game.team1 = obj.team1;
    game.team2 = obj.team2;
    game.time = new Date(obj.time);
    game.contract = contract;
    game.paidoff = false;
    game.save(function (err) {
        if (err) {
            callback(err);
        } else {
            console.log('saved');
            callback(null, obj);
        }
    });
}

const init_game_object = function (id, callback) {
    console.log('init_game_object');
    fetch_game_data(id, (err, data) => {
        if (err) {
            callback(err);
        } else {
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
                contract: "Generating",
                bin: contract_interface
            }
            deploy_contract(id, obj, (err, contract) => {
                if (err) {
                    callback(err);
                } else {
                    store_contract(obj, contract, (err, game_obj) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, game_obj);
                        }
                    });
                }
            });
        }
    });
};

const get_game_object = function (id, callback) {
    console.log('get_game_object')
    load_game_object(id, (err, game_obj) => {
        if (err) {
            console.log(err);
            if (err === 'game not found') {
                init_game_object(id, callback = (err, obj) => {
                    callback(null, obj);
                });
            } else {
                callback(err, null);
            }
        } else {
            callback(null, game_obj);
        }
    })
}

exports.get = function (req, res) {
    var id = req.params.id.toString();
    get_game_object(id, (err, obj) => {
        if (err) {
            return res.status(500).send(err);
        } else {
            obj.bin = contract_source;
            res.render('game', obj);
        }
    });
};
