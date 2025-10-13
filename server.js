// server/server.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
// Setup Socket.IO with CORS policies to allow our React app to connect
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // This is the address of our React app
        methods: ["GET", "POST"]
    }
});

// This is our "operator" listening for connections
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // A user wants to join a specific room
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        // Tell everyone else in the room that a new person has joined
        socket.to(roomId).emit('user-joined', socket.id);
    });

    // A user is sending their "offer" to connect
    socket.on('offer', (payload) => {
        io.to(payload.target).emit('offer', { sdp: payload.sdp, source: socket.id });
    });

    // A user is sending their "answer" to an offer
    socket.on('answer', (payload) => {
        io.to(payload.target).emit('answer', { sdp: payload.sdp, source: socket.id });
    });

    // Relaying ICE candidates for establishing the P2P connection
    socket.on('ice-candidate', (payload) => {
        io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate, source: socket.id });
    });

    // Relaying chat messages
    socket.on('chat-message', ({ roomId, message }) => {
        socket.to(roomId).emit('chat-message', { message, senderId: socket.id });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`✅ Signaling server is running on port ${PORT}`));