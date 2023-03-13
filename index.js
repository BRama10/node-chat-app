const express = require('express');

const http = require('http');

const app = express();

var server = http.Server(app);

var io = require('socket.io')(server);

const PORT_NUMBER = 3001;


server.listen(PORT_NUMBER, function() {
    console.log('Server Started!');
})

io.on('connection', function(socket) {
    //socket.emit('new_user');
    console.log('New User');
})