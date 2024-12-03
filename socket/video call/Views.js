const {
    handleConnection,
    handleDisconnection,
    handleRoomJoin
} = require('./Controllers');

module.exports = (io) => {
    io.on('connection', (socket) => {
        handleConnection(socket);

        socket.on('disconnect', async () => {
            handleDisconnection(socket);
        });

        // Handle room joining
        socket.on('join_room', (data, callback) => {
            handleRoomJoin(io, socket, data, callback);
        });

        socket.on('leave_room', (data, callback) => {
            handleRoomLeave(io, socket, data, callback);
        });
    });
};