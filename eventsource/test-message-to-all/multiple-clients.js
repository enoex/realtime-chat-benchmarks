/* =========================================================================
 * 
 * client-simple.js
 *  Simple eventsource client
 *
 *  ======================================================================== */
var EventSource = require('eventsource');
var async = require("async");
var _ = require("lodash");
var http = require('http');
var request = require('request');
var fs = require("fs");
var helpers = require('./helpers.js');


var MAX_PEOPLE_ROOM = 6;
var received_msg = 0;

http.globalAgent.maxSockets = Infinity;

//Command line arguments
var NROFCLIENTS = process.argv[2] || 1;
var ITERATIONS = process.argv[4] || 1;
var PORT = process.argv[3] || 8010;

console.log("Number of Clients: ", NROFCLIENTS);
console.log("Number of Iterations: ", ITERATIONS);
console.log("Connect to port: ", PORT);

var startTime = new Date().getTime();

var logFileTime = './logs/time.log';
//Set Log file to zero
fs.writeFile(logFileTime, "", function (err) { if (err) return console.log(err);});

var iterationsDone = 0;
var clients = [];
var i = 0;

async.eachLimit(_.range(NROFCLIENTS), 20, function(index, callback){

  var roomId = Math.floor(index / MAX_PEOPLE_ROOM);
  var headers = {headers: {'room': "r-"+roomId}};
  var es = new EventSource('http://localhost:'+(PORT)+'/eventsource', headers);
  

  // Message callbacks
  es.onmessage = function(i){
    return function(e) {
        console.log('General Msg :::', i, e.data);
        
    };
  }(index);
  
  es.onerror = function(e) {
      console.log('ERROR!', JSON.stringify(e));
  };

  
  es.addEventListener("r-" + roomId, function(rIfd, clientId){
    return function(e, i){
      received_msg++;

      if(received_msg % NROFCLIENTS === 0){
        
        iterationsDone++;
      } 
      var timeReceived = new Date().getTime();
      var timeSend = parseInt(e.data, 10);
      var delta = timeReceived - timeSend;
      console.log(received_msg, "Got it: timeReceived delta:", delta);  

      fs.appendFile(logFileTime, (delta)+"\n", function (err) { if (err) return console.log(err); });
      
    };
  }(roomId, index));

  if(i === MAX_PEOPLE_ROOM){

    i = 0;

  }

  if(i === 0){
    
      es.roomId = "r-"+roomId;
      clients.push(es);
  }
  
    
  i++;
  callback();
  
    

}, function(results){
  
  console.log("Created all clients");


  setTimeout(function(d, i){
    
    var intervalId = setInterval(function(){

            if(iterationsDone < ITERATIONS ){
              
              _.each(clients, function(client, i){

              var roomId = "r-"+Math.floor(i / MAX_PEOPLE_ROOM);
              //console.log("Send a response", client.roomId);
              var url = "http://localhost:8010/msg";
              request.post(url, {form: {msg: client.roomId, time: new Date().getTime() }} , function(err, res){
                if(err){
                  return console.log("An error occured", JSON.stringify(err));
                }
              
                //console.log("Received a response", res.body, "received_msg", received_msg);
              });

            });


            }else{
              console.log("Finished all iterations");
              clearInterval(intervalId);

              helpers.calcAvg( logFileTime, 0, function(val){
                console.log("Average time to send one message to a room", Math.round(val * 100) / 100, (val/1000).toFixed(2), "(s)");
                console.log("Message Received: ", received_msg);

                var finishedTime = new Date().getTime();

                var total = finishedTime - startTime;
                console.log("Total time: ", total/1000," seconds");
                //fs.writeFile(logFileTime, "", function (err) { if (err) return console.log(err);});
                process.exit(0);
              });

              
            }
      
    }, 1000);


  }, 1000);



});



