const express = require('express');

const http = require('http');

const app = express();

var server = http.Server(app);

var io = require('socket.io')(server);