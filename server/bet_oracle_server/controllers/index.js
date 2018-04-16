'use strict';

var IndexModel = require('../models/index');

var games = require('./games');
var allgames = require('./allgames');
var game = require('./game');

module.exports = function (router) {

    var model = new IndexModel();

    router.get('/', function (req, res) {
        
        
        res.render('index', model);
        
        
    });

    router.get('/games', games.get);
    router.get('/allgames', allgames.get);
    router.get('/game/:id', game.get);

};
