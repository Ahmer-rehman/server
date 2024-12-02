const handleMessage = (io, socket, data, callback) => {
    try {
        // // Add tVCestamp and generate unique message ID
        // const messageWithMetadata = {
        //     ...data,
        //     tVCestamp: new Date().toISOString(),
        // };

        // // Broadcast message to all connected VC clients
        // io.emit('message', messageWithMetadata);

        // Send acknowledgement back to the sender
        if (callback) {
            callback({
                status: 'received',
                messageId: 'You message has been received'
            });
        }
    } catch (error) {
        console.error('VC message handling error:', error);

        // Send error acknowledgement if something goes wrong
        if (callback) {
            callback({
                status: 'error',
                message: 'Failed to process VC message'
            });
        }
    }
};

// Handle user connection
const handleConnection = (socket) => {
    // Send user ID back to the client upon connection
    socket.emit('user_connected', {
        socketId: socket.id
    });

    console.log('New VC client connected:', { socketId: socket.id });
};

// Handle user disconnection
const handleDisconnection = (socket) => {
    console.log('VC client disconnected:', { socketId: socket.id });
};

module.exports = {
    handleMessage,
    handleConnection,
    handleDisconnection
};