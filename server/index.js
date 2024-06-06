const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        allowedHeaders: ["Access-Control-Allow-Origin"],
        credentials: true
    }
});

const router = require('./router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(router);

io.on('connection', (socket) => {
    console.log('We have a new connection!!!', socket.id);

    socket.on('join', ({ name, room }, callback) => {
        console.log('User joining:', { name, room });
        const { error, user } = addUser({ id: socket.id, username: name, room });

        if (error) {
            console.error('Join error:', error);
            return callback(error);
        }

        console.log('User joined:', user);
        console.log('Current users:', getUsersInRoom(room));

        socket.join(user.room);

        socket.emit('message', { user: 'Admin', text: `${user.username}, welcome to the room ${user.room}` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.username} has joined!` });

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', { user: user.username, text: message });
            callback();
        } else {
            console.error(`User not found for socket ID: ${socket.id}`);
            callback('User not found');
        }
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.username} has left.` });
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        }
        console.log('User has left!!!', socket.id);
    });
});

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
