# Event Source


## Clarification
* SSE = Server-Sent Events
* Authentification
* CORS support
* Cookies
* Backlog


* sRightScale
–nouse-idle-notifications
Gateaway timeouts




## Findings


* The field name must be either “data”, “event”, “id”, or “retry”.
* A message from the server can contain ```event:``` and a client can listen for that event type
* Client can only receive UTF-8 data (No binary data)
* You need to set the ```http.globalAgent.maxSockets``` in your node.js server (this works for Express.js too)


```bash 
  # 1. Start Express.Js Server, which handles incoming EventSource connections
  # The server will every 1.5s show some machine status and the # of connected clients
  $ node server-express.js


  # 2. Connect x number of event source clients (ex: clients 100, port: 8123)
  # Takes in the number of clients to create as a first command line argument
  $ node multiple-clients.js 100 8123
  
  # The script calls x times the client-simple.js script in the express folder
  
```

## Results

### Memory Footprint

This runs the server on port 8010: ```$ node test-message-to-all/server-express.js 8010```

and connect for instance 1000 clients and do 2 iterations of message sending. Connect to port 8010.

```$ node test-message-to-all/multiple-simple.js 1000 2 8010```


| Type    | Test                | Machine    | Number Clients  | Heap Start | End   |Delta  | Env   |
|---------|---------------------|------------|----------------:| ----------:|-------|------:|-------|
| Normal  | Create Clients      | roundrobin |           1000  | 27MB       | 155MB | 128MB | Local |
| Normal  | Finished Msg send.  | roundrobin |           1000  | 155MB      | 155MB |       | Local |
| Normal  | Create Clients      | roundrobin |           15000 | 27MB       | 269MB | 242MB | Local |

### How long does it takes to connect clients?

Running the script: ```$node client-profiling.js NR_OF_CLIENTS NR_OF_ITERATIONS MQTT_URI```

| Type    | Test           | Machine    | Number Clients  | Time in seconds  | Protocol    | Env   |
|---------|----------------|------------|----------------:|-----------------:|-------------|-------|
| Normal  | Create Clients | roundrobin |           1000  | 1.512   S        | EventSource | Local |
| Normal  | Create Clients | roundrobin |           2000  | 2.249   S        | EventSource | Local |
| Normal  | Create Clients | roundrobin |           3000  | 17.598  S        | EventSource | Local |
| Normal  | Create Clients | roundrobin |           4000  | 25.09   S        | EventSource | Local |
| Normal  | Create Clients | roundrobin |           5000  | 46.373  S        | EventSource | Local |
| Normal  | Create Clients | roundrobin |           6000  | 60.635  S        | EventSource | Local |
| Normal  | Create Clients | roundrobin |          10000  | 91.16   S        | EventSource | Local |
| Normal  | Create Clients | roundrobin |          15000  | 5635    S        | EventSource | Local |
| Normal  | Create Clients | roundrobin |          15000  | 211.963 S        | EventSource | Local |

### How long does it takes to send 1 message to x clients? (x rooms a 6 people)

In this test we first connect x number of clients to the server through an eventsource connection. While doing that we put each client in a room
with max 6 people. After the creation phase one client in each room sends one message. We repeat that message sending process x times.

Payload: Javascript Timestamp

| Type        | Test             | Machine      | Senders      | Clients    | Iterat.      | Avg Time | Total       | CPU Avg  | #Msg   |
| ----------- | ---------------- | ------------ | ------------ | ---------: | -----------: | -------: | ----------: | -------: | -----: |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 1000       | 1            | 0.02 s   | 3.353 s     |  6.6  %  | 1000   |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 1000       | 10           | 0.02 s   | 13.595 s    |  9.33 %  | 10000  |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 1000       | 100          | 0.01 s   | 108.67 s    |  5.41 %  | 101240 |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 2000       | 1            | 0.03 s   | 5.837  s    |  4.27 %  | 2490   |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 2000       | 10           | 0.03 s   | 24.842 s    |  3.67 %  | 20020  |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 2000       | 100          | 0.09 s   | 266.289 s   |  3.54 %  | 201758 |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 3000       | 1            | 0.08 s   | 24.91 s     |  6.54 %  | 3264   |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 3000       | 10           | 0.11 s   | 42.7 s      |  3.32 %  | 30450  |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 3000       | 100          | 0.35 s   | 500.89 s    |  3.28 %  | 303534 |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 4000       | 100          | 0.76 s   | 1054.449 s  |  3.17 %  | 406597 |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 6000       | 1            | 0.16 s   | 87.676 s    |  7.39 %  | 6228   |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 6000       | 2            | 1.49 s   | 129.514 s   |  6.51 %  | 12156  |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 6000       | 10           | 1.49 s   | 387.154 s   |  3.50 %  | 61466  |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 10000      | 1            | 2.82 s   | 188.652 s   |  3.84 %  | 10477  |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 10000      | 2            | 4.80 s   | 310.41 s    |  4.78 %  | 25130  |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 15000      | 1            | 5.64 s   | 1013.484 s  |  4.73 %  | 17453  |
| Normal      | Send Msg         | roundrobin   | 1 per room   | 20000      | 1            | 7.23 s   | 469.806 s   |  3.91 %  | 21818  |







## Libaries

* https://github.com/segmentio/sse



## Links
* [Load Testing Server Sent Event Streams](http://matthiasnehlsen.com/blog/2013/05/11/load-testing-server-sent-event-streams/)
* [Basic Introduction](http://www.html5rocks.com/en/tutorials/eventsource/basics/)
* [Pros and Cons](http://www.activestate.com/blog/2013/07/server-sent-events-aura-and-nodejs)
* [What is SSE and what not](http://tomkersten.com/articles/server-sent-events-with-node/)
* [Good Overview](http://chimera.labs.oreilly.com/books/1230000000545/ch16.html#EVENT_STREAM_PROTOCOL)
* [Example Archicture for SSE](http://www.slideshare.net/beatfactor/sse-23276287)
* [What are Long-Polling, Websockets, Server-Sent Events (SSE) and Comet?](http://stackoverflow.com/questions/11077857/what-are-long-polling-websockets-server-sent-events-sse-and-comet)


# Performance Node.JS
https://hacks.mozilla.org/2013/01/building-a-node-js-server-that-wont-melt-a-node-js-holiday-season-part-5/

## Session Affinity
* http://shlomoswidler.com/2010/04/elastic-load-balancing-with-sticky-sessions.html
* http://stackoverflow.com/questions/1040025/difference-between-session-affinity-and-sticky-session
* http://stackoverflow.com/questions/1553645/pros-and-cons-of-sticky-session-session-affinity-load-blancing-strategy

## Terms
* session affinity
* sticky session
* Last-Event-ID: 43
* 
# Interesting Companies
* http://www.lightstreamer.com/


## Optimize Node
* http://stackoverflow.com/questions/12886438/node-js-app-has-periodic-slowness-and-or-timeouts-does-not-accept-incoming-requ
* http://stackoverflow.com/questions/19626527/mac-osx-10-9-listen-backlog-works-not-properly
* http://blog.arc90.com/2012/03/05/profiling-node-programs-on-mac-os-x/


27mb

EADDRNOTAVAIL
ETIMEDOUT
EADDRNOTAVAIL



* Disconnect clients from server




## Memory leaks
* https://github.com/joyent/node/issues/5345
* http://simonmcmanus.wordpress.com/2013/01/03/forcing-garbage-collection-with-node-js-and-v8/
* [Good Thread about RSS Leaks](* https://github.com/einaros/ws/issues/43)
* [Walmart Memory Leak](http://www.joyent.com/blog/walmart-node-js-memory-leak)
* https://github.com/bnoordhuis/node-heapdump


* Node event stuff
* Manual GC clear




