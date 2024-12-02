const {
    handleMessage,
    handleConnection,
    handleDisconnection
} = require('./Controllers');

module.exports = (io) => {
    io.on('connection', (socket) => {
        handleConnection(socket);

        socket.on('message', async (data, callback) => {
            handleMessage(io, socket, data, callback);
        });

        socket.on('disconnect', async () => {
            handleDisconnection(socket);
        });
    });
};