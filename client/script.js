const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

const recognition = new SpeechRecognition();

var socket = io();

var typing = false;
var timeout = undefined;

$(document).ready(function() {
    
    const w =  window.innerWidth;
    const e = document.getElementsByClassName('py-5')[0];
    e.setAttribute('style', 'min-width: {}px;'.format(w*0.75));

    $('#sendBox').keyup((e) => {
        if(e.which != 13) {
            typing = true;
            socket.emit('typing', {
                'username' : getLocalStorage('username'),
                'room' : getLocalStorage('currentRoom'),
                'typing' : true });
            clearTimeout(timeout);
            timeout = setTimeout(typingTimeout, 650);
        } else {
            clearTimeout(timeout);
            typingTimeout();
        }
    })

    $('.form-floating').keydown(function(e) {
        if(e.which == 13 && !e.shiftKey) {
            e.preventDefault();
        }
    });

    $('.form-floating').keyup(function(e) {
        if(e.which == 13 && !e.shiftKey) {
            sendMessage();
            console.log('huh');
        }
    });

    $('.password-special').keydown(function(e) {
        if(e.which == 13 && !e.shiftKey) {
            e.preventDefault();
        }
    });

    $('.password-special').keyup(function(e) {
        if(e.which == 13 && !e.shiftKey) {
            sendDetails();
        }
    });

    $(document).on('click', 'ul li a', function (e) {
        if($(this).parent().attr('id') != 'new_chat' && $(this).parent().attr('id') != 'settings' && $(this).parent().attr('id') != undefined) {
            e.preventDefault();
            
            var contactId = $(this).parent().attr('id');

            var userId = getLocalStorage('username').toLowerCase().replace(/\s/g, '')

            const temp = setCurrentRoom(contactId, userId);

            const status = clearChatDisplay();

            displayChat(temp);

            document.getElementById($(this).parent().attr('id')).classList.add('bg-primary');

            try {
                if($(this).parent().attr('id') != getLocalStorage('currTab')) {
                    document.getElementById(getLocalStorage('currTab')).classList.remove('bg-primary');
                }
            } catch {
                console.log('First Time Selection!');
            }
            
            const temp1 = setLocalStorage('currTab', $(this).parent().attr('id'));

            var scrollDiv = document.getElementById('chat-container-alpha');
            scrollDiv.scrollTop = scrollDiv.scrollHeight;


        } else if($(this).parent().attr('id') == 'new_chat') {
            e.preventDefault();
            socket.emit('get_user_list'); 
        } else if($(this).parent().attr('id') == 'settings'){
            e.preventDefault();
            $('#settingsModal').modal('toggle');
        }
    });


    $(document).on('click', '.fa-file-arrow-up', function() {
        $('#files').click();

        setTimeout(function() {
            submitFiles()
        }, 10000)
    
    });

    $(document).on('click', '.fa-paper-plane', function() {
        sendMessage();
    });

    $(document).on('click', '.fa-fade', function() {
        toggleVoIP();
    });

});

function logout() {
    const temp1 = setLocalStorage('username', null);
    const temp2 = setLocalStorage('currTab', null);
    const temp3 = setLocalStorage('currentRoom', null);
    const temp4 = setLocalStorage('status', null);

    window.location.reload()
}

function pfpModal() {
    $('#pfpModal').modal('toggle');
}

function statusModal() {
    $('#statusModal').modal('toggle');
    document.querySelector('#user-status').value = getLocalStorage('status');
}

function updatePfp() {
    $('#files').click();

    setTimeout(function() {
        submitPicture()
    }, 10000)
}

function updateStatus() {
    $('#statusModal').modal('toggle');
    setLocalStorage('status', document.querySelector('#user-status').value);
    socket.emit('update_status', {'username' : getLocalStorage('username'), 'status' : document.querySelector('#user-status').value})
}

function typingTimeout() {
    typing = false;
    socket.emit('typing', {
        'username' : getLocalStorage('username'),
        'room' : getLocalStorage('currentRoom'),
        'typing' : false });

}

function toggleVoIP() {
    const e = document.getElementsByClassName('fa-fade')[0];
    if(e.classList.contains('clicked')) {
        e.classList.remove('fa-microphone-slash');
        e.classList.add('fa-microphone');
        e.classList.remove('clicked');
        recognition.stop();
    } else {
        e.classList.add('clicked');
        e.classList.add('fa-microphone-slash');
        e.classList.remove('fa-microphone');

        recognition.continuous = true;
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start()
    }
}

recognition.onresult = (event) => {
    var word = event.results[event.results.length-1][event.results[event.results.length-1].length-1].transcript;
    parseVoIP(word);
};

recognition.onspeechend = () => {
    //recognition.stop();
    console.log();
};

function parseVoIP(word) {
    if(word.toLowerCase().replace(/\s/g, '') == 'send') {
        sendMessage();
    } else {
        const e = document.getElementById('sendBox');
        sendBox.value += word;
    }
}

function submitFiles() {
    const files = document.getElementById('files');

    const formData = new FormData();

    formData.append('name', getLocalStorage('username'));
    formData.append('type', 'chat_files');
    formData.append('time', new Date());

    for(let i =0; i < files.files.length; i++) {
        formData.append("files", files.files[i]);
    }

    fetch("http://localhost:3001/upload_chat_files", {
        method: 'POST',
        body: formData
    })
        .then((res) => res.json())
        .then((data) => data['data'])
        .then((d) => { 
            socket.emit('send_message', {
            'username' : getLocalStorage('username'),
            'room' : getLocalStorage('currentRoom'),
            'message' : d['message'],
            'time' : d['time'],
            '<Optional>FilePath' : d['filePath']
            });
        })
        .catch((err) => ("Error occured", err));
}

function submitPicture() {
    const files = document.getElementById('files');

    const pictureData = new FormData();

    pictureData.append('name', getLocalStorage('username'));
    pictureData.append('type', 'profile_picture');

    for(let i =0; i < files.files.length; i++) {
        pictureData.append("files", files.files[i]);
    }

    

    fetch("http://localhost:3001/upload_profile_picture", {
        method: 'POST',
        body: pictureData
    })
        .then((res) => res.json())
        .then((data) => {
            document.getElementById('thisProfileDisplay').src = data[getLocalStorage('username')]
        })
        .then;
}

function displayChat(chatName) {
    var chatList = document.getElementsByClassName('conversation-box');
    const e = chatList.namedItem(chatName);

    e.setAttribute('style', 'display: block;');
}

function clearChatDisplay() {
    var chatList = document.getElementsByClassName('conversation-box');

    for(let i = 0; i < chatList.length; i++) {
        const e = chatList.item(i);

        e.setAttribute('style', 'display: none;');
    }
    
    return true;
}

function createChat(roomName) {
    const status = clearChatDisplay();

    var elem = document.createElement('ul');
    elem.classList.add('list-unstyled');
    elem.classList.add('text-white');
    elem.classList.add('conversation-box');

    elem.setAttribute('id', roomName);
    elem.setAttribute('style', 'display: block;')
    elem.innerHTML = '<li class="d-flex justify-content-between mb-4"> <img src="http://localhost:3001/local_img/gibbs_facepic.png" alt="avatar" class="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="60"> <div class="card mask-custom"> <div class="card-header d-flex justify-content-between p-3" style="border-bottom: 1px solid rgba(255,255,255,.3);"> <p class="fw-bold mb-0">Welcome Bot</p> <p class="text-light small mb-0"><i class="far fa-clock"></i>Infinite</p> </div> <div class="card-body"> <p class="mb-0"> This is the start of your messaging in this chat group! </p> </div> </div> </li>';

    document.getElementById('chat-container-alpha').appendChild(elem);
}


function extractNameFromGroup(name) {
    const myIdIndex = name.indexOf(getLocalStorage('username').toLowerCase().replace(/\s/g, ''));

    if(myIdIndex == 0) {
        var domain = name.slice(len+1,);
    } else {
        var domain = name.slice(0, myIdIndex-1);
    }

    return domain;

}

function setCurrentRoom(id_1, id_2) {
    var idFirst = id_1 < id_2

    if(idFirst) {
        return setLocalStorage('currentRoom', id_1+'-'+id_2);
    } 
    return setLocalStorage('currentRoom', id_2+'-'+id_1);
}

String.prototype.format = function() {
    var i =0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

function twoWayGroup(username) {
    socket.emit('new_group', {curr_user : getLocalStorage('username'), new_user : username});
    $('#newChatModal').modal('toggle');

}

socket.on('user_list', function(data) {
    var userList = data['users'];

    try {
        for (let a = 0; a < userList.length; a++) {
            if (userList.at(a)['username'] == getLocalStorage('username')) {
                var currUser = userList.at(a);
            }
        }



        var containerBox = document.getElementsByClassName('list-group')[0];
        containerBox.innerHTML = '<button type="button" class="list-group-item list-group-item-action" disabled>Users</button>';

        var alrUsers = new Array();

        for (let z = 0; z < currUser['groups'].length; z++) {
            alrUsers.push(extractNameFromGroup(currUser['groups'].at(z)));
        }

        for (let i = 0; i < userList.length; i++) {
            if (userList.at(i)['username'] == getLocalStorage('username') || alrUsers.includes(userList.at(i)['username'].toLowerCase().replace(/\s/g, ''))) {
                continue;
            }

            const elem = document.createElement('button');
            elem.classList.add('list-group-item');
            elem.classList.add('list-group-item-action');
            elem.setAttribute('type', 'button');
            elem.innerHTML = userList.at(i)['username'];

            if (true) {
                elem.setAttribute('onclick', 'twoWayGroup(this.innerHTML)');
            } else {
                console.log('Placeholder');
            }

            containerBox.appendChild(elem);
        }

        $('#newChatModal').modal('toggle');
    } catch (e) {
        alert('No New Users!')
    }

})

socket.on('invalid_request', function(data) {
    socket.emit('new_session');
})

socket.on('new_instance', function(data) {
    var usernameExists = getLocalStorage('username') || false;
    console.log(usernameExists);
    if(usernameExists == false) {
        socket.emit('new_session');
    } else {
        socket.emit('existing_session', {username : usernameExists});
    }
});

socket.on('add_contact', function(data) {
    var newData = data['data']
    var roomName = data['roomName'];

    var keys = Object.keys(newData);
    for(let i = 0; i < keys.length; i++) {
        if(!(keys.at(i).includes(getLocalStorage('username'))) && !(keys.at(i).includes('status'))) {
            var newUser = keys.at(i); 
        }
    }
    createChat(roomName);

    console.log(data);
    
    addNewContact(newData[newUser], newUser, newData[newUser+'|status'], '');

    const temp = setCurrentRoom(newUser.toLowerCase().replace(/\s/g, ''), getLocalStorage('username').toLowerCase().replace(/\s/g, ''));

    const status = clearChatDisplay();

    displayChat(temp);

    document.getElementById(newUser.toLowerCase().replace(/\s/g, '')).classList.add('bg-primary');

    try {
        if(newUser.toLowerCase().replace(/\s/g, '') != getLocalStorage('currTab')) {
            document.getElementById(getLocalStorage('currTab')).classList.remove('bg-primary');
        }
    } catch {
        console.log('First Time Selection!');
    }
            
    const temp1 = setLocalStorage('currTab', newUser.toLowerCase().replace(/\s/g, ''));

})

socket.on('typing-display', function(data) {
    if(data['typing'] == true && data['username'] != getLocalStorage('username')) {
        $('#typing-status').text('{} is typing....'.format(data['username']));
        $('#collapse').show('toggle');
    } else {
        $('#collapse').hide('toggle');
    }
})


socket.on('display_chat', function(data) {
    var username = setLocalStorage('username', data['username']);
    const status = setLocalStorage('status', data['status']);

    $('#loginModal').hide();

    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();

    $('body').css('background-image', 'url("./client/gradient-sunset.jpeg")');

    var groups = data['groups'];

    var pictureArr = data['pictureArr'];
    var statusArr = data['statusArr'];

    //problem line - need to find a way to bypass error
    document.getElementById('login-session').style.display = 'none';

    document.getElementById('chat-session').style.display = 'flex';

    for(let x = 0; x < groups.length; x++) {
        const status = clearChatDisplay();


        //add new contact
        const members = groups.at(x)['members'];
        for(let z = 0; z< members.length; z++) {
            if(username != members.at(z)) {
                var otherUser = members.at(z);
            }
        }
        
        addNewContact(pictureArr[otherUser], otherUser, statusArr[otherUser], '');

        //create new group chat
        createChat(groups.at(x)['name']);

        //populate group chat
        const messages = groups.at(x)['messages'];
        for(let b = 0; b < messages.length; b++) {
            const message = messages.at(b);
            writeMessage(groups.at(x)['name'], pictureArr[message['sender']], message['sender'], message['message'], message['time'], message['filePath']);
        }
    }

    clearChatDisplay();


})

socket.on('transmit_message', function(data) {

    var pfp_link = data['userPFP'];
    var msg_details = data['msgBody'];
    /** 
    var len = getLocalStorage('username').toLowerCase().replace(/\s/g, '').length;
    const myIdIndex = msg_details['room'].indexOf(getLocalStorage('username').toLowerCase().replace(/\s/g, ''));

    if(myIdIndex == 0) {
        var domain = msg_details['room'].slice(len+1,);
    } else {
        var domain = msg_details['room'].slice(0, myIdIndex-1);
    }
    */
    
    writeMessage(msg_details['room'], pfp_link, msg_details['username'], msg_details['message'], msg_details['time'], msg_details['<Optional>FilePath']);
   

    
})

function toggleDisplay() {
    var heading = document.getElementById('heading-type');
    var footer = document.getElementById('footer-type');

    if(heading.innerText == "Login") {
        heading.innerText = "Register";
        footer.innerHTML = 'Already Here?   <a href="#" onclick="toggleDisplay()"><b>Login</b></a>';
    } else {
        heading.innerText = "Login";
        footer.innerHTML = 'New Here?   <a href="#" onclick="toggleDisplay()"><b>Signup</b></a>';
    }
    
}

function togglePasswordVisibility() {
    if($('#password-toggle').hasClass('fa-eye')) {
        $('#password-toggle').removeClass('fa-eye');
        $('#password-toggle').addClass('fa-eye-slash');
        $('#password').attr('type', 'text');
    } else {
        $('#password-toggle').removeClass('fa-eye-slash');
        $('#password-toggle').addClass('fa-eye');
        $('#password').attr('type', 'password');
    }
}

function sendDetails() {
    var USERNAME = document.getElementById('username').value;
    var PASSWORD = document.getElementById('password').value;
    if($('#heading-type').html() == "Register") {
        socket.emit('register_user', {'username' : USERNAME, 'password' : PASSWORD})
    } else {
        socket.emit('validate_user', {'username' : USERNAME, 'password' : PASSWORD})
    }
}

function setLocalStorage(key, val) {
    if(window.localStorage) {
        window.localStorage.setItem(key, val);
    }

    return val;
}

function getLocalStorage(key) {
    return window.localStorage ? window.localStorage.getItem(key) : '';
}



function addNewContact(imageSource, name, status, time) {
    var elem = document.createElement('li');
    elem.classList.add('p-2');
    elem.classList.add('border-bottom');
    elem.setAttribute('style', 'border-bottom: 1px solid rgba(255,255,255,.3) !important;')

    elem.setAttribute('id', name.toLowerCase().replace(/\s/g, ''));

    elemInnerHTMLtemplate = '<a href="#" class="d-flex justify-content-between link-light"><div class="d-flex flex-row"> <img src="{}" alt="avatar" class="rounded-circle d-flex align-self-center me-3 shadow-1-strong" width="60"> <div class="pt-1"> <p class="fw-bold mb-0">{}</p> <p class="small text-white">{}</p> </div> </div> <div class="pt-1"> <p class="small text-white mb-1">{}</p> <span class="text-white float-end"><i class="fas fa-check" aria-hidden="true"></i></span> </div> </a>'.format(imageSource, name, status, time);

    elem.innerHTML = elemInnerHTMLtemplate;

    document.getElementById('contact-list').appendChild(elem);
}



function sendMessage() {
    var msgText = document.getElementById('sendBox').value;

    document.getElementById('sendBox').value = '';

    socket.emit('send_message', {
        'username' : getLocalStorage('username'),
        'room' : getLocalStorage('currentRoom'),
        'message' : msgText,
        'time' : new Date()
    });

    console.log({
        'username' : getLocalStorage('username'),
        'room' : getLocalStorage('currentRoom'),
        'message' : msgText,
        'time' : new Date()
    })
}




function writeMessage(domain, img_src, name, msg_content, time, filePath) {
    var elem = document.createElement('li');
    elem.classList.add('d-flex');
    if(name == getLocalStorage('username')) {
        elem.classList.add('justify-content-end');
    } else {
        elem.classList.add('justify-content-between');
    }
    elem.classList.add('mb-4');
    
    const formatDate = new Intl.DateTimeFormat("en" , {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });

    if(filePath == undefined) {
        if(name == getLocalStorage('username')) {
            elem.innerHTML = '<li class="d-flex justify-content-between mb-4">  <div class="card mask-custom" style="min-width:325px;"> <div class="card-header d-flex justify-content-between p-3" style="border-bottom: 1px solid rgba(255,255,255,.3);"> <p class="fw-bold mb-0">{}</p> <p class="text-light small mb-0"><i class="far fa-clock"></i>{}</p> </div> <div class="card-body"> <p class="mb-0"> {} </p> </div> </div> <img src="{}" alt="avatar" class="rounded-circle d-flex align-self-end me-3 shadow-1-strong" width="60"> </li>'.format(name, new Date(time).toLocaleTimeString(), msg_content, img_src);
        } else {
            elem.innerHTML = '<li class="d-flex justify-content-between mb-4"> <img src="{}" alt="avatar" class="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="60"> <div class="card mask-custom" style="min-width:325px; background-color: hsla(218, 85%, 59%, 0.79)"> <div class="card-header d-flex justify-content-between p-3" style="border-bottom: 1px solid rgba(255,255,255,.3);"> <p class="fw-bold mb-0">{}</p> <p class="text-light small mb-0"><i class="far fa-clock"></i>{}</p> </div> <div class="card-body"> <p class="mb-0"> {} </p> </div> </div>  </li>'.format(img_src, name, new Date(time).toLocaleTimeString(), msg_content);
        }
    } else {
        if(name == getLocalStorage('username')) {
            elem.innerHTML = '<li class="d-flex justify-content-between mb-4">  <div class="card mask-custom" style="min-width:325px;"> <div class="card-header d-flex justify-content-between p-3" style="border-bottom: 1px solid rgba(255,255,255,.3);"> <p class="fw-bold mb-0">{}</p> <p class="text-light small mb-0"><i class="far fa-clock"></i>{}</p> </div> <div class="card-body"> <p class="mb-0"><a class="btn btn-primary" href="{}" role="button" target="_blank"> {} </a> </p> </div> </div> <img src="{}" alt="avatar" class="rounded-circle d-flex align-self-end me-3 shadow-1-strong" width="60"> </li>'.format(name, new Date(time).toLocaleTimeString(), filePath, msg_content, img_src);
        } else {
            elem.innerHTML = '<li class="d-flex justify-content-between mb-4"> <img src="{}" alt="avatar" class="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="60"> <div class="card mask-custom" style="min-width:325px; background-color: hsla(218, 85%, 59%, 0.79)"> <div class="card-header d-flex justify-content-between p-3" style="border-bottom: 1px solid rgba(255,255,255,.3);"> <p class="fw-bold mb-0">{}</p> <p class="text-light small mb-0"><i class="far fa-clock"></i>{}</p> </div> <div class="card-body"> <p class="mb-0"><a class="btn btn-primary" href="{}" role="button" target="_blank"> {} </a> </p> </div> </div>  </li>'.format(img_src, name, new Date(time).toLocaleTimeString(), filePath, msg_content);
        }
    
    }
    
    document.getElementById(domain).appendChild(elem);

    
    var scrollDiv = document.getElementById('chat-container-alpha');
    scrollDiv.scrollTop = scrollDiv.scrollHeight;
}   



