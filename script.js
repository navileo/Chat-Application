document.addEventListener('DOMContentLoaded', () => {
    // Ensure WebSocket connection is established only after DOM is fully loaded

    const authContainer = document.getElementById('auth-container');
    const chatContainer = document.getElementById('chat-container');
    const authForm = document.getElementById('auth-form');
    const usernameInput = document.getElementById('username');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesDiv = document.getElementById('messages');
    const roomListDiv = document.getElementById('room-list');
    const createRoomForm = document.getElementById('create-room-form');
    const newRoomNameInput = document.getElementById('new-room-name');
    const userListDiv = document.getElementById('user-list');
    const formatBtns = document.querySelectorAll('.format-btn');
    const emojiBtn = document.querySelector('.emoji-btn');

    let username = '';
    let currentRoom = 'general'; // Default room
    let ws = null; // WebSocket connection

    // --- User Authentication ---
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        username = usernameInput.value.trim();
        if (username) {
            authContainer.style.display = 'none';
            chatContainer.style.display = 'flex';
            initializeWebSocket();
        }
    });

    // --- WebSocket Initialization ---
    function initializeWebSocket() {
        // Replace with your WebSocket server URL
        ws = new WebSocket('ws://localhost:8080'); // Explicitly define WebSocket server URL 

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            // Send join message to the server
            ws.send(JSON.stringify({ type: 'join', username: username, room: currentRoom }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                case 'message':
                        console.log('Received message for room:', data.room, 'Current room:', currentRoom);
                        displayMessage(data.username, data.message, data.timestamp, data.room === currentRoom);
                        break;
                case 'roomList':
                    updateRoomList(data.rooms);
                    break;
                case 'userList':
                    updateUserList(data.users);
                    break;
                case 'history':
                    data.messages.forEach(msg => displayMessage(msg.username, msg.message, msg.timestamp, true));
                    break;
                case 'error':
                    console.error('Server error:', data.message);
                    alert('Error: ' + data.message);
                    break;
            }
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e, event.data);
            }
        };

        ws.onclose = (event) => {
            console.log('Disconnected from WebSocket server:', event);
            // Handle reconnection or inform user
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error); // Log the full error object
            alert('WebSocket connection error. Please check console for details.');
        };
    }

    // --- Message Display ---
    function displayMessage(sender, message, timestamp, isCurrentRoom) {
        if (!isCurrentRoom) return; // Only display messages for the current room

        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === username ? 'sent' : 'received');

        const senderSpan = document.createElement('span');
        senderSpan.classList.add('sender');
        senderSpan.textContent = sender;

        const textContent = document.createElement('p');
        textContent.innerHTML = formatMessage(message); // Apply formatting

        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('timestamp');
        timestampSpan.textContent = new Date(timestamp).toLocaleTimeString();

        messageElement.appendChild(senderSpan);
        messageElement.appendChild(textContent);
        messageElement.appendChild(timestampSpan);

        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to bottom
    }

    // --- Message Sending ---
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'message', room: currentRoom, message: message }));
            displayMessage(username, message, new Date().toISOString(), true); // Display message immediately
            messageInput.value = '';
        }
    });

    // --- Message Formatting ---
    function formatMessage(text) {
        // Bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italics
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Links (basic URL detection)
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        return text;
    }

    formatBtns.forEach(button => {
        button.addEventListener('click', () => {
            const format = button.dataset.format;
            const start = messageInput.selectionStart;
            const end = messageInput.selectionEnd;
            const selectedText = messageInput.value.substring(start, end);
            let formattedText = selectedText;

            switch (format) {
                case 'bold':
                    formattedText = `**${selectedText}**`;
                    break;
                case 'italic':
                    formattedText = `*${selectedText}*`;
                    break;
                case 'link':
                    const url = prompt('Enter URL:');
                    if (url) {
                        formattedText = `[${selectedText}](${url})`; // Markdown link format
                    }
                    break;
            }
            messageInput.setRangeText(formattedText, start, end, 'end');
            messageInput.focus();
        });
    });

    // --- Emoji Picker ---
    const emojis = ['😀', '😂', '😊', '😍', '🤩', '👍', '👎', '❤️', '💔', '👏', '🔥', '💯', '🤔', '🥳', '😎', '😭', '😡', '🤯', '😴', '👋'];
    let emojiPicker = null;

    emojiBtn.addEventListener('click', () => {
        if (emojiPicker) {
            emojiPicker.remove();
            emojiPicker = null;
            return;
        }

        emojiPicker = document.createElement('div');
        emojiPicker.classList.add('emoji-picker');
        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.textContent = emoji;
            btn.addEventListener('click', () => {
                messageInput.value += emoji;
                emojiPicker.remove();
                emojiPicker = null;
                messageInput.focus();
            });
            emojiPicker.appendChild(btn);
        });
        document.querySelector('.message-input').appendChild(emojiPicker);
    });

    // Close emoji picker if clicked outside
    document.addEventListener('click', (e) => {
        if (emojiPicker && !emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.remove();
            emojiPicker = null;
        }
    });

    // --- Room Management ---
    function updateRoomList(rooms) {
        roomListDiv.innerHTML = '';
        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.textContent = room;
            roomElement.classList.add('room-item');
            if (room === currentRoom) {
                roomElement.classList.add('active');
            }
            roomElement.addEventListener('click', () => {
                joinRoom(room);
            });
            roomListDiv.appendChild(roomElement);
        });
    }

    function joinRoom(room) {
        if (ws && ws.readyState === WebSocket.OPEN && room !== currentRoom) {
            ws.send(JSON.stringify({ type: 'leave', username: username, room: currentRoom }));
            currentRoom = room;
            messagesDiv.innerHTML = ''; // Clear messages for new room
            ws.send(JSON.stringify({ type: 'join', username: username, room: currentRoom }));
            // Update active room in UI
            document.querySelectorAll('.room-item').forEach(item => {
                item.classList.remove('active');
                if (item.textContent === room) {
                    item.classList.add('active');
                }
            });
        }
    }

    createRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newRoomName = newRoomNameInput.value.trim();
        if (newRoomName && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'createRoom', room: newRoomName }));
            newRoomNameInput.value = '';
        }
    });

    // --- User List ---
    function updateUserList(users) {
        userListDiv.innerHTML = '<h2>Users</h2><ul>' + users.map(user => `<li>${user}</li>`).join('') + '</ul>';
    }
});