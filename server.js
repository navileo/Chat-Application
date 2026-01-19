const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Store active users and rooms
const users = {}; // { socketId: { username, room } }
const activeUsernames = new Set();
const rooms = new Set(['General', 'Technology', 'Random']);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send the list of available rooms to the newly connected user
    socket.emit('roomList', Array.from(rooms));

    // Handle joining a room
    socket.on('joinRoom', ({ username, room }) => {
        const cleanUsername = username ? username.trim() : '';
        const user = users[socket.id];

        // If user already exists and is just switching rooms
        if (user) {
            const oldRoom = user.room;
            if (oldRoom === room) return;

            socket.leave(oldRoom);
            socket.to(oldRoom).emit('message', {
                username: 'System',
                text: `${user.username} has left the room.`,
                time: new Date().toISOString(),
                system: true
            });

            user.room = room;
            socket.join(room);
            
            socket.to(room).emit('message', {
                username: 'System',
                text: `${user.username} has joined the room.`,
                time: new Date().toISOString(),
                system: true
            });

            socket.emit('message', {
                username: 'System',
                text: `You joined ${room}.`,
                time: new Date().toISOString(),
                system: true
            });
            return;
        }

        // First time joining
        if (!cleanUsername) {
            return socket.emit('error', 'Username is required.');
        }
        
        if (activeUsernames.has(cleanUsername)) {
            return socket.emit('error', 'Username is already taken.');
        }

        // Join the room
        socket.join(room);
        
        // Store user info
        users[socket.id] = { username: cleanUsername, room };
        activeUsernames.add(cleanUsername);

        console.log(`${cleanUsername} joined room: ${room}`);

        // Broadcast to room that user joined
        socket.to(room).emit('message', {
            username: 'System',
            text: `${cleanUsername} has joined the chat.`,
            time: new Date().toISOString(),
            system: true
        });

        // Welcome current user
        socket.emit('message', {
            username: 'System',
            text: `Welcome to the ${room} room, ${cleanUsername}!`,
            time: new Date().toISOString(),
            system: true
        });
    });

    // Handle creating a new room
    socket.on('createRoom', (roomName) => {
        if (roomName && roomName.trim() !== '') {
            const cleanRoom = roomName.trim();
            rooms.add(cleanRoom);
            io.emit('roomList', Array.from(rooms));
        }
    });

    // Handle chat messages
    socket.on('chatMessage', (msg) => {
        const user = users[socket.id];
        if (user) {
            io.to(user.room).emit('message', {
                username: user.username,
                text: msg,
                time: new Date().toISOString()
            });
        }
    });

    // Handle file messages
    socket.on('fileMessage', (fileData) => {
        const user = users[socket.id];
        if (user) {
            io.to(user.room).emit('message', {
                username: user.username,
                file: fileData,
                time: new Date().toISOString()
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            console.log(`${user.username} disconnected`);
            socket.to(user.room).emit('message', {
                username: 'System',
                text: `${user.username} has left the chat.`,
                time: new Date().toISOString(),
                system: true
            });
            activeUsernames.delete(user.username);
            delete users[socket.id];
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
