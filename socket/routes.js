const { v4: uuidv4 } = require('uuid');
const { redisClient } = require("../redis");

module.exports = (io) => {
    io.on('connection', (socket) => {
        // Send user ID back to the client upon connection
        socket.emit('user_connected', {
            socketId: socket.id
        });

        console.log('New client connected:', { socketId: socket.id });

        // Enhanced message event with acknowledgement
        socket.on('message', async (data, callback) => {
            try {
                // Add timestamp and userId to message
                const messageWithMetadata = {
                    ...data,
                    userId: userId,
                    timestamp: new Date().toISOString(),
                    messageId: uuidv4()
                };

                // Log message in Redis (optional, but useful for persistence)
                await redisClient.hSet(`message:${messageWithMetadata.messageId}`, {
                    userId: userId,
                    text: data.text,
                    timestamp: messageWithMetadata.timestamp
                });

                console.log('Received message:', messageWithMetadata);

                // Broadcast message to all connected clients
                io.emit('message', messageWithMetadata);

                // Send acknowledgement back to the sender
                if (callback) {
                    callback({
                        status: 'received',
                        messageId: messageWithMetadata.messageId
                    });
                }
            } catch (error) {
                console.error('Message handling error:', error);

                // Send error acknowledgement if something goes wrong
                if (callback) {
                    callback({
                        status: 'error',
                        message: 'Failed to process message'
                    });
                }
            }
        });

        socket.on('disconnect', async () => {
            // Remove user information from Redis on disconnect
            await redisClient.del(`user:${userId}`);
            console.log('Client disconnected:', { userId, socketId: socket.id });
        });
    });
};