const socket = io();

// DOM Elements
const joinContainer = document.getElementById('join-container');
const chatContainer = document.getElementById('chat-container');
const joinForm = document.getElementById('join-form');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const roomSelect = document.getElementById('room-select');
const roomsList = document.getElementById('rooms-list');
const newRoomInput = document.getElementById('new-room');
const createRoomBtn = document.getElementById('create-room-btn');
const errorMessage = document.getElementById('error-message');
const displayUsername = document.getElementById('display-username');
const displayRoom = document.getElementById('display-room');
const roomNameDisplay = document.getElementById('room-name-display');
const leaveBtn = document.getElementById('leave-btn');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// New DOM Elements
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
const fileBtn = document.getElementById('file-btn');
const fileInput = document.getElementById('file-input');
const msgInput = document.getElementById('msg');

let currentUsername = '';
let currentRoom = '';

const emojis = ['😀', '😂', '😍', '👍', '🔥', '🎉', '👋', '🤔', '😎', '😢', '❤️', '✨', '🙌', '🚀', '💯', '🌈', '🍕', '🐱'];

// --- Emoji Picker Setup ---
emojis.forEach(emoji => {
    const span = document.createElement('span');
    span.classList.add('emoji-item');
    span.textContent = emoji;
    span.addEventListener('click', () => {
        msgInput.value += emoji;
        emojiPicker.classList.add('hidden');
        msgInput.focus();
    });
    emojiPicker.appendChild(span);
});

emojiBtn.addEventListener('click', () => {
    emojiPicker.classList.toggle('hidden');
});

// Close emoji picker when clicking outside
document.addEventListener('click', (e) => {
    if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
        emojiPicker.classList.add('hidden');
    }
});

// --- File Upload Handling ---
fileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result
        };
        socket.emit('fileMessage', fileData);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
});

// --- Socket Events ---

// Get room list from server
socket.on('roomList', (rooms) => {
    updateRoomList(rooms);
});

// Receive message from server
socket.on('message', (message) => {
    outputMessage(message);
    // Smooth scroll to bottom
    setTimeout(() => {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }, 50);
});

// Handle errors (e.g., duplicate username)
socket.on('error', (msg) => {
    errorMessage.textContent = msg;
    joinContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
});

// --- Event Listeners ---

// Join chat
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const room = roomSelect.value;

    if (username) {
        currentUsername = username;
        currentRoom = room;

        // Emit joinRoom event
        socket.emit('joinRoom', { username, room });

        // Show chat UI
        joinContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        
        // Update display info
        displayUsername.textContent = username;
        displayRoom.textContent = room;
        roomNameDisplay.textContent = room;
        
        // Reset error message
        errorMessage.textContent = '';
    }
});

// Create new room
createRoomBtn.addEventListener('click', () => {
    const roomName = newRoomInput.value.trim();
    if (roomName) {
        socket.emit('createRoom', roomName);
        newRoomInput.value = '';
    }
});

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let msg = msgInput.value.trim();

    if (msg) {
        // Emit message to server
        socket.emit('chatMessage', msg);

        // Clear input
        msgInput.value = '';
        msgInput.focus();
        
        // Hide emoji picker if open
        emojiPicker.classList.add('hidden');
    }
});

// Leave chat
leaveBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave the chat?')) {
        window.location.reload();
    }
});

// Mobile menu toggle
mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Close sidebar when clicking overlay
sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

// Close sidebar when clicking on a room (mobile)
roomsList.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
});

// --- Helper Functions ---

// Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.style.opacity = '0';
    div.style.transform = 'translateY(20px)';
    
    if (message.system) {
        div.classList.add('system');
        div.innerHTML = `<p class="message-text">${message.text}</p>`;
    } else {
        const isOwn = message.username === currentUsername;
        div.classList.add(isOwn ? 'own' : 'other');
        
        let content = '';
        if (message.file) {
            if (message.file.type.startsWith('image/')) {
                content = `
                    <div class="file-info">${message.file.name}</div>
                    <img src="${message.file.data}" alt="${message.file.name}" onclick="window.open(this.src)">
                `;
            } else {
                content = `
                    <a href="${message.file.data}" download="${message.file.name}" class="file-link">
                        <i class="fas fa-file-download"></i>
                        <span>${message.file.name} (${formatBytes(message.file.size)})</span>
                    </a>
                `;
            }
        } else {
            // Format text (Bold, Italics, Links)
            content = formatMessage(message.text);
        }
        
        div.innerHTML = `
            <div class="message-info">
                <span class="sender">${isOwn ? 'You' : message.username}</span>
                <span class="time">${message.time}</span>
            </div>
            <p class="message-text">${content}</p>
        `;
    }
    
    chatMessages.appendChild(div);

    // Trigger animation
    requestAnimationFrame(() => {
        div.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';
    });
}

// Format bytes for file size
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Update room list in dropdown and sidebar
function updateRoomList(rooms) {
    // Update select dropdown
    roomSelect.innerHTML = rooms
        .map(room => `<option value="${room}">${room}</option>`)
        .join('');

    // Update sidebar list
    roomsList.innerHTML = rooms
        .map(room => `
            <li class="${room === currentRoom ? 'active' : ''}" onclick="switchRoom('${room}')">
                <i class="fas fa-hashtag"></i> ${room}
            </li>
        `)
        .join('');
}

// Switch room function (accessible globally for onclick)
window.switchRoom = (room) => {
    if (room === currentRoom) return;
    
    if (confirm(`Switch to ${room}? Your current conversation in ${currentRoom} will be cleared.`)) {
        // Clear current messages
        chatMessages.innerHTML = '';
        
        // Join new room
        currentRoom = room;
        socket.emit('joinRoom', { username: currentUsername, room });
        
        // Update UI
        displayRoom.textContent = room;
        roomNameDisplay.textContent = room;
        
        // Update active class in sidebar
        document.querySelectorAll('.rooms-list li').forEach(li => {
            li.classList.toggle('active', li.textContent.trim() === room);
        });
    }
};

// Format message text
function formatMessage(text) {
    // Escape HTML to prevent XSS
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    // Bold: *text*
    escaped = escaped.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    
    // Italics: _text_
    escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Links: http(s)://...
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    escaped = escaped.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return escaped;
}
