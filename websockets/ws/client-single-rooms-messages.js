/* =========================================================================
 *
 *  client-single-rooms-messages
 *
 *  establishes NUM_CONNECTIONS connections using a single
 *  node process (?) and splits up WebSockets into rooms with a max of
 *  6 connections per room
 *
 *
 * ========================================================================= */
var colors = require('colors');
var async = require('async');
var _ = require('lodash');
var winston = require('winston');
var WebSocket = require('ws');
var colors = require('colors');

var logger = new (winston.Logger) ({
    transports: [
        new (winston.transports.File) ({
            filename: 'logs/client-room-queue-amqp-broadcast-back.log',
            level: 'verbose'
        })
    ]
});

    // Total # connections
var NUM_CONNECTIONS = 20000,
    // number of messages to send
    NUM_MESSAGES = 3000,
    NUM_CONCURRENT = 50,
    sockets = [],
    messages = {};

// Stats overview
// --------------------------------------
function format (val){
    return Math.round(((val / 1024 / 1024) * 1000) / 1000) + 'mb';
}

var statsId = setInterval(function () {
    console.log('Memory Usage :: '.bold.green.inverse +
        ("\tRSS: " + format(process.memoryUsage().rss)).blue +
        ("\tHeap Total: " + format(process.memoryUsage().heapTotal)).yellow +
        ("\t\tHeap Used: " + format(process.memoryUsage().heapUsed)).magenta
    );
}, 1500);

var numConnections = 0;

process.on('uncaughtException', function (err) {
    console.log('xxxxxxxxxxxxxxxxxx'.bold.yellow);
    console.log('  UNCAUGHT EXCEPTION '.yellow);
    console.log(err+'');
    console.log('xxxxxxxxxxxxxxxxxx'.bold.yellow);
});

// Spawn connections
// --------------------------------------
async.eachLimit(_.range(NUM_CONNECTIONS), 2000, function (i, cb) {
    try {
        // Just use floor(i / 6) as room ID for now; ensures
        // at most 6 in a room
        var roomId = Math.floor(i / 6),
            roomUri = 'ws://localhost:3000/' + roomId;
        var ws = sockets[i] = new WebSocket(roomUri, {
            protocolVersion: 8,
            origin: 'http://localhost:3000'
        });

        console.log(('Connecting ('+i+') to room #' + roomId + '...').grey);

        // Setup connections, open connection
        ws.on('open', function setupConnection() {
            // When the connection is first established, need to send over the
            // room so that the server can properly create a queue/exchange
            ws.send(JSON.stringify({
                roomId: roomId,
                socketId: i
            }));

            numConnections++;
            console.log('Connected'.green.bold +
                ' | Num connections : ' + (''+numConnections).blue);

            // continue
            setTimeout(function(){
                console.log('\t calling callback...');
                cb();
            }, 300);
        });

        ws.on('message', function(data, flags) {
            // When a message is received, nothing happens
            // irl the client should update its view or somethin
            var parsed = JSON.parse(data);
            logger.verbose("Message received from server from room " + parsed.roomId, {
                room: parsed.roomId,
                time: new Date().getTime()
            });
            console.log("Message received from server: " + data);
        });

        ws.on('close', function () {
            console.log('xxxxxxxxxxxxxxxxxx'.bold.red);
            console.log('  Disconnected'.red);
            console.log('xxxxxxxxxxxxxxxxxx'.bold.red);
        });

    } catch(err) {
        console.log('xxxxxxxxxxxxxxxxxx'.bold.yellow);
        console.log('  UNCAUGHT ERROR CONNECTING TO WEBSOCKET '.yellow);
        console.log(err+'');
        console.log('xxxxxxxxxxxxxxxxxx'.bold.yellow);
    }
}, function() {
    // Callback when the async call is finished
    console.log(("Done connecting " + NUM_CONNECTIONS + " connections.").yellow);

    var roomId = 0,
        socketId = 10;

    for (var i = 0; i < 10; i++) {
        setTimeout(function() {
            setInterval(function() {
                // Send a message with a room ID
                var time = new Date().getTime();
                sockets[socketId].send(JSON.stringify({
                    roomId: roomId,
                    time: time,
                    message: 'hello world'
                }));

                logger.verbose("Message sent from room " + roomId, {
                    room: roomId,
                    time: time
                });

                socketId = (socketId + 1) % sockets.length;
                roomId = (roomId + 1) % Math.floor(sockets.length / 6);
            }, 300);
        }, 177 * i);
    }
});
