# Chat Application

This is a simple chat application built with Node.js for the backend WebSocket server and a plain HTML, CSS, and JavaScript frontend.

## Features

- User authentication (username selection)
- Real-time messaging
- Room management (create, join, display rooms)
- Message editing and deletion
- Emoji reactions
- Desktop notifications for new messages
- Persistent sessions (maintains user and room state)

## Setup and Installation

Follow these steps to get the chat application up and running on your local machine.

### Prerequisites

Make sure you have the following installed:

-   Node.js (LTS version recommended)
-   npm (Node Package Manager, comes with Node.js)

### 1. Clone the Repository (if applicable)

If you haven't already, clone this repository to your local machine:

```bash
git clone <repository_url>
cd "Chat Application"
```

### 2. Install Dependencies

Navigate to the project directory and install the necessary Node.js packages for the server:

```bash
npm install
```

### 3. Start the Backend Server

Run the Node.js WebSocket server. This server handles message routing, room management, and user connections.

```bash
node server.js
```

The server will typically run on `ws://localhost:8080`.

### 4. Start the Frontend Server

To serve the static frontend files (HTML, CSS, JavaScript), you can use a simple HTTP server. If you don't have one, you can install `http-server` globally:

```bash
npm install -g http-server
```

Then, from the project root directory, start the HTTP server:

```bash
http-server
```

This will usually serve the application on `http://localhost:8080` or `http://127.0.0.1:8080` (or another available port).

### 5. Access the Application

Open your web browser and navigate to the address provided by the `http-server` (e.g., `http://127.0.0.1:8080`).

## Usage

1.  **Enter Username**: Upon opening the application, you'll be prompted to enter a username. This username will be used to identify you in the chat.
2.  **Join/Create Rooms**: You can join existing rooms from the room list or create a new room.
3.  **Send Messages**: Type your message in the input field and press Enter or click the send button.
4.  **Edit/Delete Messages**: You can edit or delete your own messages by clicking the respective buttons next to them.
5.  **React to Messages**: Click the 'React' button next to a message to add an emoji reaction.

## Project Structure

-   `index.html`: The main HTML file for the chat application frontend.
-   `styles.css`: Contains the CSS for styling the chat interface.
-   `script.js`: The frontend JavaScript logic, including WebSocket client, UI interactions, and message handling.
-   `server.js`: The Node.js backend WebSocket server implementation.
-   `package.json`: Defines project metadata and dependencies for the Node.js server.
-   `package-lock.json`: Records the exact versions of dependencies.

## Contributing

Feel free to fork the repository, make improvements, and submit pull requests.
