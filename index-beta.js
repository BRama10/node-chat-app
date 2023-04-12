String.prototype.format = function() {
    var i =0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

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
        if(type == 'arr') {
            this.collection = new Array();
        } else {
            this.collection = {};
        }
        this.type = type;
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

function writeJSONStringToCollection(str) {

}

class User {
    constructor(username, password, pfp='http://localhost:3001/local_img/callen_facepic.png', groups=[], socket_id=null,pictureArray, status, statusArray) {
        this.username = username;
        this.password = password;
        this.pfp = pfp;
        this.groups = groups;
        this.socket_id = socket_id;
        pictureArray.addObject(this.username, this.pfp);
        this.status = status;
        statusArray.addObject(this.username, this.status);
    }

    getStatus() {
        return this.status;
    }

    updateStatus(newStatus, statusArr) {
        this.status = newStatus;
        statusArr.addObject(this.username, this.status);
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
            'socket_id' : this.socket_id,
            'status' : this.status
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

const request = require('request');

const nodemailer = require('nodemailer');

const express = require('express');

const http = require('http');

const app = express();

var server = http.Server(app);

var io = require('socket.io')(server);

const multer = require("multer");

let fs = require('fs-extra')

const { createHash } = require('crypto');

const config = {
    service : 'gmail',
    host : 'smtp.gmail.com',
    port : 587,
    secure : false,
    auth : {
        user : 'codingbot88@gmail.com',
        pass : 'diumkoyjjyssusrr'
    },
};

const transporter = nodemailer.createTransport(config);

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
            } else if(req.body['type'] == 'profile_picture') {
                var user = userCollection.getObjectByAttribute(req.body['name'], 'username');

                req.body.process = 'http://localhost:3001'+path;

                user.updatePfp(req.body.process, pictureCollection);
            } else {
                req.body.process = 'http://localhost:3001'+path;
            }

            callback(null, file.originalname);
        }
    })
 });

const PORT_NUMBER = 3001;

var userCollection = new Collection('arr','users');
var groupCollection = new Collection('arr', 'groups');
var pictureCollection = new Collection('obj', 'pictures');
var statusCollection = new Collection('obj', 'status');


userCollection.addObject(null, new User('Balaji R', 'passw0rd', 'http://localhost:3001/local_img/callen_facepic.png', [], null, pictureCollection, "Hi! I'm using Messaging!", statusCollection));

function hash(string) {
    return createHash('sha256').update(string).digest('hex');
}

app.use('/client', express.static(__dirname + '/client'));
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/local_img', express.static(__dirname + '/local_img'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/upload_chat_files", upload.array("files"), uploadFiles);
app.post("/upload_profile_picture", upload.array("files"), uploadProfilePicture);
app.post("/upload_server_data", upload.array("files"), function(req, res) {
    request.get(req.body.process, function(err, res, body) {
        const sections = body.split('\n');
        var collectionArr = new Array();

        for(const section of sections) {
            let startIndex = section.indexOf('<~');
            let endIndex = section.indexOf('~>');

            collectionArr.push(JSON.parse(section.slice(startIndex+2, endIndex)));
        }

        userCollection = Object.assign(userCollection, collectionArr.at(0));
        groupCollection = Object.assign(groupCollection, collectionArr.at(1));
        pictureCollection = Object.assign(pictureCollection, collectionArr.at(2));
        statusCollection = Object.assign(statusCollection, collectionArr.at(3));

        console.log(userCollection);
        console.log(groupCollection);
    })

    res.send('DATA UPLOAD SUCCESSFUL');
});

function uploadFiles(req, res) {
    res.send({ data : req.body['process']});
}

function uploadProfilePicture(req, res) {
    res.send(pictureCollection.values());
}



app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/home.html');
});

app.get('/saveData', function(req, res) {
    var dataMessage = {
        from: 'Server Chatbot <codingbot88@gmail.com>',
        to: 'grand.hunter.dark.15@gmail.com',
        subject: "Data Saver",
        text: 'userCollection => <~{}~>'.format(JSON.stringify(userCollection)) + '\n' + 'groupCollection => <~{}~>'.format(JSON.stringify(groupCollection)) + '\n' + 'pictureCollection => <~{}~>'.format(JSON.stringify(pictureCollection)) + '\n' + 'statusCollection => <~{}~>'.format(JSON.stringify(statusCollection))
    }

    transporter.sendMail(dataMessage, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log(info.response);
        }
    });

    res.send('Server Data Saved via Email')
});

app.get('/loadData', function(req, res) {
    res.sendFile(__dirname + '/client/reset.html');
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
        var currUser = userCollection.getObjectByAttribute(data['username'], 'username');

        
        try {
            currUser.updateSocketId(socket.id);

            for(const group of currUser.getGroups()) {
                socket.join(group);
            }
            
            socket.emit('display_chat', {...currUser.buildObject(), ...{'groups' : getGroupsByUser(groupCollection.values(), data['username'])}, ...{'pictureArr' : pictureCollection.values()}, ...{'statusArr' : statusCollection.values()}});    
        } catch {
            socket.emit('invalid_request');
        }
        
    })

    socket.on('register_user', function(data) {
        const newUser = new User(data['username'], data['password'], 'http://localhost:3001/local_img/callen_facepic.png', [], socket.id, pictureCollection, "Hi! I'm using Messaging!", statusCollection)
        userCollection.addObject(null, newUser);

        for(const group of newUser.getGroups()) {
            socket.join(group);
        }

        socket.emit('display_chat', {...newUser.buildObject(), ...{'groups' : getGroupsByUser(groupCollection.values(), data['username'])}, ...{'pictureArr' : pictureCollection.values()}});
    })

    socket.on('validate_user', function(data) {
        var possibleUser = userCollection.getObjectByAttribute(data['username'], 'username');
        console.log(possibleUser)

        if(possibleUser != null && possibleUser != undefined && possibleUser.getPassword() == data['password']) {
            possibleUser.updateSocketId(socket.id);

            for(const group of possibleUser.getGroups()) {
                socket.join(group);
            }
            socket.emit('display_chat', {...possibleUser.buildObject(), ...{'groups' : getGroupsByUser(groupCollection.values(), data['username'])}, ...{'pictureArr' : pictureCollection.values()}, ...{'statusArr' : statusCollection.values()}});
        }
    })

    socket.on('send_message', function(data) {
        var message = new Message(data['time'], data['message'], data['username'], data['<Optional>FilePath']);
        var currGroup = groupCollection.getObjectByAttribute(data['room'], 'name');
        currGroup.addMessage(message);


        var currUser = userCollection.getObjectByAttribute(data['username'], 'username');
        
        io.in(data['room']).emit('transmit_message', {
            'msgBody' : data,
            'userPFP' : currUser.getPfpUrl()
        });
    })

    socket.on('get_user_list', function(data) {
        socket.emit('user_list', {'users' : userCollection.values()});
    })

    socket.on('new_group', function(data) {
        const roomName = createRoomName(data['curr_user'].toLowerCase().replace(/\s/g, ''), data['new_user'].toLowerCase().replace(/\s/g, ''));
        const group = new Group([data['curr_user'], data['new_user']],[], roomName);

        groupCollection.addObject(null, group);

        var oldUser = userCollection.getObjectByAttribute(data['curr_user'], 'username');
        var newUser = userCollection.getObjectByAttribute(data['new_user'], 'username');

        oldUser.updateGroups(roomName);
        newUser.updateGroups(roomName);

        socket.join(roomName); //current socket direct connection

        io.in(newUser.getSocketId()).socketsJoin(roomName);


        const dataObj = {};
        dataObj[data['curr_user']] = oldUser.getPfpUrl();
        dataObj[data['new_user'] ]= newUser.getPfpUrl();
        dataObj[data['curr_user']+'|status'] = oldUser.getStatus();
        dataObj[data['new_user']+'|status'] = newUser.getStatus();

        io.in(roomName).emit('add_contact', {'data' : dataObj, 'roomName' : roomName})

    })

    socket.on('typing', function(data) {
        io.in(data['room']).emit('typing-display',data);
    })

    socket.on('update_status', function(data) {
        var obj = userCollection.getObjectByAttribute(data['username'], 'username');
        obj.updateStatus(data['status'], statusCollection);

    })
})



function createRoomName(id_1, id_2) {
    var idFirst = id_1 < id_2

    if(idFirst) {
        return id_1+'-'+id_2;
    } 
    return id_2+'-'+id_1;
}

function getGroupsByUser(groupArr, username) {
    var groupsForUser = new Array();

    for(let i = 0; i < groupArr.length; i++) {
        if(groupArr.at(i).getMembers().includes(username)) {
            groupsForUser.push(groupArr.at(i));
        }
    }
    return groupsForUser;
}