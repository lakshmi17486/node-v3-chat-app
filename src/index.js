const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');


const app = express();
const server = http.createServer(app)
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname,'../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New web socket connection');

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options})
        if (error) {
           return callback(error);
        }
        socket.join(user.room);
        socket.emit('message', generateMessage('Admin', 'Welcome!'));

        //broadcast to only the room
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()

    })
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        if (user === undefined) {
            return callback('User not found');
        }
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message) );
        callback();
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);
        if (user === undefined) {
            return callback('User not found');
        }
        // share location to all other connections including myself
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,
            `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback('Location Shared!')
    })

    // when a socket disconnect

socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    console.log(user);

    if (user) {
    io.to(user.room).emit('message', generateMessage(`${user.username} has left`));
    }
    io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    })
})
});

server.listen(port, () => {
    console.log(`Server is up and running on port ${port}!`);
});