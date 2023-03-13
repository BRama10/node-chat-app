var socket = io();

function showScreen() {
    document.getElementById('popup-background').style.zIndex = 10;
}

function genNewUser() {
    socket.emit('new_user', { 'socketId' : socket['socket_id'], 'username' : document.getElementById('username').value});
}

window.onload = function() {
    document.getElementById('popup-background').style.width = window.innerWidth+'px';
    document.getElementById('popup-background').style.height = window.innerHeight+'px';

    document.getElementById('background').style.width = window.innerWidth+'px';
    document.getElementById('background').style.height = window.innerHeight+'px';
}