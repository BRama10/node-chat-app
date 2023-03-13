const express = require('express');

const http = require('http');

const app = express();

var server = http.Server(app);

var io = require('socket.io')(server);

const PORT_NUMBER = 3001;

var users = new Array();

app.use('/client', express.static(__dirname + '/client'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/home.html');
});

app.get('/')

server.listen(PORT_NUMBER, function() {
    console.log('Server Started!');
})

io.on('connection', function(socket) {
    //socket.emit('new_user');
    console.log('New Client Emitted');
})