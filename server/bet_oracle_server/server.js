'use strict';

var config = require('./config');
var app = require('./index');
var http = require('http');


var server;

/*
 * Create and start HTTP server.
 */

server = http.createServer(app);
server.listen(config.serverPort);
server.on('listening', function () {
    console.log('Server listening on http://localhost:%d', this.address().port);
});
