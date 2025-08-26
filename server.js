const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const rooms = { 'general': { clients: [], messageHistory: [] } }; // Stores messages and users for each room
const users = new Map(); // Map of WebSocket to { username, room }

wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', message => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'join':
                handleJoin(ws, data);
                break;
            case 'message':
                handleMessage(ws, data);
                break;
            case 'editMessage':
                handleEditMessage(ws, data);
                break;
            case 'deleteMessage':
                handleDeleteMessage(ws, data);
                break;
            case 'reactMessage':
                handleReactMessage(ws, data);
                break;
            case 'createRoom':
                handleCreateRoom(ws, data);
                break;
            case 'leave':
                handleLeave(ws, data);
                break;
        }
    });

    ws.on('close', () => {
        handleDisconnect(ws);
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
    });
});

function handleJoin(ws, data) {
    const { username, room } = data;
    if (!username || !room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Username and room are required to join.' }));
        return;
    }

    // If user is already in a room, remove them first
    if (users.has(ws)) {
        const oldRoom = users.get(ws).room;
        if (rooms[oldRoom]) {
            rooms[oldRoom].clients = rooms[oldRoom].clients.filter(u => u.ws !== ws);
            broadcastUserList(oldRoom);
        }
    }

    if (!rooms[room]) {
        rooms[room] = { clients: [], messageHistory: [] };
    }

    users.set(ws, { username, room });
    rooms[room].clients.push({ ws, username });

    console.log(`${username} joined room: ${room}`);

    // Send room history to the joining user
    const roomMessages = rooms[room].messageHistory;
    ws.send(JSON.stringify({ type: 'history', messages: roomMessages }));

    broadcastRoomList();
    broadcastUserList(room);
    broadcastMessage(room, 'System', `${username} has joined the room.`, Date.now());
}

function handleMessage(ws, data) {
    const { message, room } = data;
    const user = users.get(ws);

    if (!user || user.room !== room) {
        ws.send(JSON.stringify({ type: 'error', message: 'You are not in this room or not authenticated.' }));
        return;
    }

    const timestamp = Date.now();
    const messageId = `${user.username}-${timestamp}`;
    const formattedMessage = { id: messageId, username: user.username, message, timestamp };

    // Store message in room history (simple in-memory storage)
    if (!rooms[room]) {
        rooms[room] = { clients: [], messageHistory: [] };
    }
    rooms[room].messageHistory.push(formattedMessage);

    broadcastMessage(room, user.username, message, timestamp, messageId);
}

function handleEditMessage(ws, data) {
    const user = users.get(ws);
    if (!user) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication required to edit messages.' }));
        return;
    }

    const { id, message } = data;
    const room = user.room;

    if (rooms[room]) {
        const messageToEdit = rooms[room].messageHistory.find(msg => msg.id === id);
        if (messageToEdit && messageToEdit.username === user.username) { // Only allow sender to edit
            messageToEdit.message = message;
            // Broadcast the update to all clients in the room
            rooms[room].clients.forEach(client => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify({ type: 'messageEdited', id: id, message: message }));
                }
            });
        } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Message not found or you are not authorized to edit this message.' }));
        }
    }
}

function handleDeleteMessage(ws, data) {
    const user = users.get(ws);
    if (!user) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication required to delete messages.' }));
        return;
    }

    const { id } = data;
    const room = user.room;

    if (rooms[room]) {
        const initialLength = rooms[room].messageHistory.length;
        rooms[room].messageHistory = rooms[room].messageHistory.filter(msg => !(msg.id === id && msg.username === user.username));
        if (rooms[room].messageHistory.length < initialLength) { // If a message was actually deleted
            // Broadcast the deletion to all clients in the room
            rooms[room].clients.forEach(client => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify({ type: 'messageDeleted', id: id }));
                }
            });
        } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Message not found or you are not authorized to delete this message.' }));
        }
    }
}

function handleReactMessage(ws, data) {
    const user = users.get(ws);
    if (!user) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication required to react to messages.' }));
        return;
    }

    const { id, emoji } = data;
    const room = user.room;

    if (rooms[room]) {
        const messageToReact = rooms[room].messageHistory.find(msg => msg.id === id);
        if (messageToReact) {
            if (!messageToReact.reactions) {
                messageToReact.reactions = [];
            }
            messageToReact.reactions.push({ username: user.username, emoji: emoji });
            // Broadcast the reaction to all clients in the room
            rooms[room].clients.forEach(client => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify({ type: 'messageReacted', id: id, emoji: emoji }));
                }
            });
        } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Message not found.' }));
        }
    }
}

function handleCreateRoom(ws, data) {
    const { room } = data;
    if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room name is required.' }));
        return;
    }
    if (rooms[room]) {
        ws.send(JSON.stringify({ type: 'error', message: `Room '${room}' already exists.` }));
        return;
    }
    rooms[room] = { clients: [], messageHistory: [] };
    console.log(`Room '${room}' created.`);
    broadcastRoomList();
    ws.send(JSON.stringify({ type: 'message', username: 'System', message: `Room '${room}' created.`, timestamp: Date.now() }));
}

function handleLeave(ws, data) {
    const { username, room } = data;
    if (rooms[room]) {
        rooms[room].clients = rooms[room].clients.filter(u => u.ws !== ws);
        broadcastUserList(room);
        broadcastMessage(room, 'System', `${username} has left the room.`, Date.now());
    }
}

function handleDisconnect(ws) {
    const user = users.get(ws);
    if (user) {
        const { username, room } = user;
        if (rooms[room]) {
            rooms[room].clients = rooms[room].clients.filter(u => u.ws !== ws);
            broadcastUserList(room);
            broadcastMessage(room, 'System', `${username} has disconnected.`, Date.now());
        }
        users.delete(ws);
        console.log(`${username} disconnected from room: ${room}`);
    }
    broadcastRoomList(); // Update room list for everyone as a user might have been the last in a room
}

function broadcastMessage(room, sender, message, timestamp, messageId) {
    if (rooms[room]) {
        rooms[room].clients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({ type: 'message', id: messageId, username: sender, message, timestamp }));
            }
        });
    }
}

function broadcastRoomList() {
    const roomNames = Object.keys(rooms);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'roomList', rooms: roomNames }));
        }
    });
}

function broadcastUserList(room) {
    if (rooms[room]) {
        const roomUsers = rooms[room].clients.map(u => u.username);
        rooms[room].clients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({ type: 'userList', users: roomUsers }));
            }
        });
    }
}

console.log('WebSocket server started on ws://localhost:8080');