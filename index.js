class Group {
    constructor(members = [], messages = [], name) {
        this.members = members;
        this.messages = messages;
        this.name = name;
    }

    addMember(member) {
        this.members.push(member);
    }

    addMessage(message) {
        this.messages.push(message);

        this.messages.sort((a, b) => (a.timeInMilliseconds() > b.timeInMilliseconds()) ? 1 : -1)
    }

    getMembers() {
        return this.members;
    }

    getMessages() {
        return this.messages;
    }

    getName() {
        return this.name;
    }
}

class Message {
    constructor(time = new Date(), message, sender, filePath=null) {
        this.time = time;
        this.message = message;
        this.sender = sender;
        this.filePath = filePath;
    }

    time() {
        return this.time;
    }

    timeInMilliseconds() {
        return new Date(this.time).getTime();
    }

    message() {
        return this.message;
    }

    sender() {
        return this.sender;
    }

    filePath() {
        return this.filePath;
    }
}

class Collection {
    constructor(type='arr', name=null) {
        if(type === 'arr') {
            this.collection = new Array();
        } else {
            this.collection = {};
        }

        this.name = name;
    }

    name() {
        return this.name;
    }

    values() {
        return this.collection;
    }

    addObject(key=null, obj) {
        if(this.type != 'arr') {
            this.collection[key] = obj;
        } else {
            this.collection.push(obj);
        }
        
    }


    
    getObjectByAttribute(val, attr=null) {
        if(this.type != 'arr') {
            return null;
        }

        for(let i = 0; i < this.collection.length; i++) {
            if(this.collection.at(i)[attr] == val) {
                return this.collection.at(i);
            }
        }

        return null;
    }

    getObjectIndexByAttribute(val, attr) {
        if(this.type != 'arr') {
            return null;
        }

        for(let i = 0; i < this.collection.length; i++) {
            if(this.collection.at(i)[attr] == val) {
                return i;
            }
        }

        return null;
    }
}

class User {
    constructor(username, password, pfp='https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp', groups=[], socket_id=null,pictureArray) {
        this.username = username;
        this.password = password;
        this.pfp = pfp;
        this.groups = groups;
        this.socket_id = socket_id;
        pictureArray.addObject(this.username, this.pfp);
    }

    getUsername() {
        return this.username;
    }

    getPassword() {
        return this.password;
    }

    getPfpUrl() {
        return this.pfp;
    }

    getGroups() {
        return this.groups;
    }

    getSocketId() {
        return this.socket_id;
    }

    buildObject() { 
        return {
            'username' : this.username,
            'pfp' : this.pfp,
            'groups' : this.groups,
            'socket_id' : this.socket_id
        }
    }

    updatePfp(new_pfp, pictureArr) {
        this.pfp = new_pfp;
        pictureArr.addObject(this.username, this.pfp);
    }

    updateSocketId(new_id) {
        this.socket_id = new_id;
    }

    updateGroups(new_group) {
        this.groups.push(new_group);
    } 
}

const express = require('express');

const http = require('http');

const app = express();

var server = http.Server(app);

var io = require('socket.io')(server);

const multer = require("multer");

let fs = require('fs-extra')

const { createHash } = require('crypto');

const upload = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            let path = './uploads/';
            fs.mkdirsSync(path);
            callback(null, path);
        },
        filename: (req, file, callback) => {
            //let path = __dirname + '/uploads/'+file.originalname;
            let path = '/uploads/'+file.originalname;

            if(req.body['type'] == 'chat_files') {
                const message = new Message(
                    req.body['time'],
                    'File Attachment',
                    req.body['name'],
                    path
                )

                req.body.process = message;
            }

            callback(null, file.originalname);
        }
    })
 });

const PORT_NUMBER = 3001;

var userCollection = new Collection('arr','users');
var groupCollection = new Collection('arr', 'groups');
var pictureCollection = new Collection('obj', 'pictures');
var filesCollection = new Collection('arr', 'files');

var users = [];


var groups = [];
//groups.push(new Group(['Balaji R', 'Ananya S'], [], 'ananyasinha-balajir'));

var pictureArray = {};

var userFiles = new Array();

userCollection.addObject(null, new User('Balaji R', 'passw0rd', 'https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp', [], null, pictureCollection));

users.push({
    'username' : 'Balaji R',
    'password' : 'passw0rd',
    'pfp' : 'https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp',
    'groups' : [],
    'socket_id' : null
});

pictureArray['Balaji R'] = 'https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp';

function hash(string) {
    return createHash('sha256').update(string).digest('hex');
}


function getGroupsByUser(username) {
    var groupsForUser = new Array();

    for(let i = 0; i < groups.length; i++) {
        if(groups.at(i).getMembers().includes(username)) {
            groupsForUser.push(groups.at(i));
        }
    }
    return groupsForUser;
}

app.use('/client', express.static(__dirname + '/client'));
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/local_img', express.static(__dirname + '/local_img'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/upload_chat_files", upload.array("files"), uploadFiles);

function uploadFiles(req, res) {
    res.send({ data : req.body['process']});
}


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/home.html');
});

app.get('/adminDebug', function(req, res) {
    const combined = [users, groups];
    res.send(combined);
});

server.listen(PORT_NUMBER, function() {
    console.log('Server Started!');
})

io.on('connection', function(socket) {
    socket.emit('new_instance');

    socket.on('new_session', function(data) {
        //Redundant Code - Only here for mental guidance
    })

    socket.on('existing_session', function(data) {
        const username = data['username'];

        for(let i = 0; i < users.length; i++) {
            if(users.at(i)['username'] == username) {

                users.at(i)['socket_id'] = socket.id;

                for(let z = 0; z < users.at(i)['groups'].length; z++) {
                    socket.join(users.at(i)['groups'].at(z));
                    console.log(users.at(i)['groups'].at(z))
                }
                
                console.log(users);
                console.log(groups);
                socket.emit('display_chat', {'username' : data['username'], 'groups' : getGroupsByUser(data['username']), 'pictureArr' : pictureArray});

            }
        }
    })

    socket.on('register_user', function(data) {
        const tempArr = {'username' : data['username'], 
                        'password' : data['password'], 
                        'pfp' : 'https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp',
                        'groups' : [],
                        'socket_id' : socket.id};
        users.push(tempArr);

        pictureArray[data['username']] = 'https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp';
        
        for(let z = 0; z < tempArr['groups'].length; z++) {
            socket.join(tempArr['groups'].at(z));
        }

        socket.emit('display_chat', {'username' : data['username'], 'groups' : getGroupsByUser(data['username']), 'pictureArr' : pictureArray});
    })

    socket.on('validate_user', function(data) {
        const username = data['username'];
        const pwd = data['password'];
        var loggedIn = false;

        for(let i = 0; i < users.length; i++) {
            if(users.at(i)['username'] == username && users.at(i)['password'] == pwd) {
                users.at(i)['socket_id'] = socket.id;

                for(let z = 0; z < users.at(i)['groups'].length; z++) {
                    socket.join(users.at(i)['groups'].at(z));
                }

                socket.emit('display_chat', {'username' : data['username'], 'groups' : getGroupsByUser(data['username']), 'pictureArr' : pictureArray});
                loggedIn = true;
            }
        }

        if(!loggedIn) {
            socket.emit('failed_login');
            console.log('FALED');
        }
    })

    socket.on('send_message', function(data) {
        var message = new Message(data['time'], data['message'], data['username'], data['<Optional>FilePath']);

        

        

        for(let i = 0; i < groups.length; i++) {
            var currGroup = groups.at(i);

            if(currGroup.name == data['room']) {
                currGroup.addMessage(message);
                
                for(let j = 0; j < users.length; j++) {
                    if(users.at(j)['username'] == data['username']) {
                        var pfpURL = users.at(j)['pfp'];
                    }
                }


                io.in(data['room']).emit('transmit_message', {
                    'msgBody' : data,
                    'userPFP' : pfpURL
                });

                console.log({
                    'msgBody' : data,
                    'userPFP' : pfpURL
                })
                
            }
        }
    })

    socket.on('get_user_list', function(data) {
        socket.emit('user_list', {'users' : users});
    })

    socket.on('new_group', function(data) {
        var user1 = data['curr_user']; //current socket user
        var user2 = data['new_user']; //external socket user

        const roomName = createRoomName(user1.toLowerCase().replace(/\s/g, ''), user2.toLowerCase().replace(/\s/g, ''));
        const group = new Group([user1, user2],[], roomName);

        groups.push(group);

        //add group name to user

        for(let z = 0; z < users.length; z++) {
            if(users.at(z)['username'] == user1) {
                users.at(z)['groups'].push(roomName);
            } else if(users.at(z)['username'] == user2) {
                users.at(z)['groups'].push(roomName);
            }
        }

        //end section

        socket.join(roomName); //current socket direct connection

        for(let i = 0; i < users.length; i ++) {
            if(users.at(i)['username'] == user2) {
                var otherUserSocketId = users.at(i)['socket_id'];
                var user2pfp = users.at(i)['pfp'];
            } else if(users.at(i)['username'] == user1) {
                var user1pfp = users.at(i)['pfp'];
            }
        }
        io.in(otherUserSocketId).socketsJoin(roomName);

        const dataObj = {};
        dataObj[user1] = user1pfp;
        dataObj[user2] = user2pfp;

        io.in(roomName).emit('add_contact', {'data' : dataObj, 'roomName' : roomName})

    })

    socket.on('typing', function(data) {
        io.in(data['room']).emit('typing-display',data);
    })
})



function createRoomName(id_1, id_2) {
    var idFirst = id_1 < id_2

    if(idFirst) {
        return id_1+'-'+id_2;
    } 
    return id_2+'-'+id_1;
}