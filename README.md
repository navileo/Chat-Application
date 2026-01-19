# ChatStream - Real-Time Chat Application

ChatStream is a modern, stylish, and robust real-time chat application built with Node.js, Socket.io, and pure HTML/CSS/JS. It allows users to join chat rooms, communicate instantly, and enjoy a seamless experience across devices.

## Live Demo

https://chat-application-puf8.onrender.com/

## 🚀 Features

- **✨ Modern UI/UX**: Responsive glassmorphism design with smooth animations and transitions.
- **📱 Mobile & Desktop Ready**: Optimized layout with a sliding sidebar for mobile devices.
- **🕒 Smart Timestamps**: Messages automatically display the time in your local timezone.
- **😀 Emoji Picker**: Quick access to a variety of emojis to express yourself.
- **📁 File & Image Sharing**: Send images (with previews) and other files (with download links) instantly.
- **💬 Real-Time Interaction**: Instant message exchange using WebSockets (Socket.io).
- **🔒 Secure Identity**: Unique username enforcement to prevent impersonation.
- **🏠 Room Management**: Create and join dynamic chat rooms.
- **📝 Message Formatting**: Support for **Bold**, _Italics_, and clickable links.
- **🔔 System Notifications**: Real-time alerts when users join or leave.

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3 (Custom Styles), JavaScript (ES6+)
- **Backend**: Node.js, Express
- **Real-Time**: Socket.io
- **Icons**: Font Awesome

## 📋 Prerequisites

Before running the application, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (Node Package Manager)

## 🏃 Setup and Run Instructions

1. **Clone or Download** the project folder.
2. **Open a terminal** in the project root directory.
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the server**:
   ```bash
   npm start
   ```
5. **Open your browser** and navigate to `http://localhost:3000`.

## 🌐 Deployment

This application is production-ready and can be deployed to services like **Render**, **Railway**, or **Fly.io**.

### **Step 1: Push to GitHub**
1. Create a new repository on GitHub.
2. Open your terminal in the project folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### **Step 2: Deploy to Render (Recommended)**
1. Create a free account on [Render.com](https://render.com/).
2. Click **"New +"** and select **"Web Service"**.
3. Connect your GitHub repository.
4. Use the following settings:
   - **Language**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **"Deploy Web Service"**.

## 📝 Usage

1. **Enter a unique username** on the landing page.
2. **Select a room** from the dropdown or **create a new one**.
3. Click **"Join Chat"** to enter the chat room.
4. Start messaging!
   - Use `*text*` for **bold**.
   - Use `_text_` for _italics_.
   - Links starting with `http://` will automatically become clickable.

---
Built with ❤️ by ChatStream Team
