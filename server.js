const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (HTML, JS, CSS)
app.use(express.static('public'));

// Store connected users
let users = [];

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    users.push(socket.id);

    // Notify other users of a new connection
    io.emit('user-connected', socket.id);

    // Listen for signaling messages from clients (e.g., offer, answer, ICE candidates)
    socket.on('offer', (offer, targetId) => {
        io.to(targetId).emit('offer', offer, socket.id);
    });

    socket.on('answer', (answer, targetId) => {
        io.to(targetId).emit('answer', answer, socket.id);
    });

    socket.on('ice-candidate', (candidate, targetId) => {
        io.to(targetId).emit('ice-candidate', candidate, socket.id);
    });

    // Listen for random user connection requests
    socket.on('connect-random', () => {
        // Find a random online user
        const randomUserId = users[Math.floor(Math.random() * users.length)];

        if (randomUserId && randomUserId !== socket.id) {
            io.to(socket.id).emit('random-user-found', randomUserId);
        }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        users = users.filter((userId) => userId !== socket.id);
        io.emit('user-disconnected', socket.id);
    });
});

// Start server on port 3000
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
