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
const source = fs.readFileSync('./contracts/bet.sol', "utf8");
const compiled = Solidity.compile(source, 1).contracts[':Bet'];
const contract_interface = compiled.interface;
const contract_bytecode = compiled.bytecode;

const deploy = async () => {
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
    console.log('send');
    await
        contractDeploy.send({
            from: config.etherAccount,
            gas: gasEstimated,
            gasPrice: gasPrice
        }, function (error, transactionHash) { console.log(error) })
            .on('error', function (error) { console.log(error) })
            .on('transactionHash', function (transactionHash) { console.log(transactionHash) })
            .on('receipt', function (receipt) {
                console.log(receipt.contractAddress) // contains the new contract address
            })
            .on('confirmation', function (confirmationNumber, receipt) { console.log(receipt) })
            .then(function (newContractInstance) {
                contractAddress = newContractInstance.options.address;
                console.log(newContractInstance.options.address); // instance with the new contract address
            });

    console.log('deployed!');
    web3.personal.lockAccount(config.etherAccount);
    return contractAddress;
};


var GameModel = require('../../models/game');

const generate_contract = function (id, obj, res) {
    GameModel.findOne({ id: id }, function (err, game) {
        if (err || !game) {
            // deploy();
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
            if (!obj.paidoff) {
                obj.contract = deploy();
            }
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
        contract: "Generating",
        bin: contract_interface
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