const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectToDatabase = require("../db");
const { redisConnection, redisClient } = require("../redis");

const port = 8080;
const app = express();

connectToDatabase();

redisConnection();

app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    methods: ['GET', 'POST']
}));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:8080', 'http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});


require('./instant messaging/Views')(io.of('/im'));
require('./video call/Views')(io.of('/vc'));

server.listen(port, () => {
    console.log(`Socket server running on port ${port}`);
});