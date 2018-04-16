'use strict';

var mongoose = require('mongoose');

var gameModel = function () {
    var gameSchema = new mongoose.Schema({
        id: { type: Number, unique: true },
        team1: String,
        team2: String,
        time: Date,
        paidoff: {type: Boolean, default: false},
        contract: String
    });
    return mongoose.model('Games', gameSchema);
};

module.exports = new gameModel();