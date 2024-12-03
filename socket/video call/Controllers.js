const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const randomString = require("randomstring");
const { redisClient } = require("../../redis");


const JWT_SECRET = "298fhn98b87vh!@ERFE$G$%Rbrtrbh";

// Backend Views.js (Controllers.js)
const handleConnection = (socket) => {
    // Send user ID back to the client upon connection
    socket.emit('vc_connected', {
        socket_id: socket.id
    });

    console.log('New VC client connected:', { socketId: socket.id });
};

const handleRoomJoin = async (io, socket, data, callback) => {
    const { room_id, username, accessToken } = data;

    let user = null

    try {
        user = jwt.verify(accessToken, JWT_SECRET);
    } catch (error) {

    }

    const payload = {
        user: user,
        username: username,
        socket_id: socket.id
    }

    // Store the user in Redis for this room
    try {
        // First, get existing users for the room
        const existingUsersJson = await redisClient.get(room_id);
        const existingUsers = existingUsersJson ? JSON.parse(existingUsersJson) : [];

        // Check if user is already in the room to avoid duplicates
        const userExists = existingUsers.some(u => u?.socket_id === socket.id);

        if (!userExists) {
            // Add the new user to the room's user list
            const updatedUsers = [...existingUsers, payload];

            // Store the updated user list back in Redis
            await redisClient.set(room_id, JSON.stringify(updatedUsers));
        }

        // Broadcast to other users in the room that a new user has joined
        socket.to(room_id).emit('user_joined', {
            socket_id: socket.id,
            username: username
        });

        const temp = await redisClient.get(room_id);
        console.log(JSON.parse(temp))

        // Optional: Acknowledge the room join
        if (callback) {
            callback({
                status: 'joined',
                room_id: room_id,
                users: existingUsers
            });
        }
    } catch (error) {
        console.error('Error storing room users in Redis:', error);

        if (callback) {
            callback({
                status: 'error',
                message: 'Failed to join room'
            });
        }
    }
};

// New function to handle user leaving a room
const handleRoomLeave = async (io, socket, data, callback) => {
    const { room_id, username } = data;

    try {
        // First, get existing users for the room
        const existingUsersJson = await redisClient.get(room_id);
        const existingUsers = existingUsersJson ? JSON.parse(existingUsersJson) : [];

        // Remove the user with the matching socket_id
        const updatedUsers = existingUsers.filter(u => u?.socket_id !== socket.id);

        // Update Redis with the new user list
        if (updatedUsers.length > 0) {
            await redisClient.set(room_id, JSON.stringify(updatedUsers));
        } else {
            // If no users left, remove the room key
            await redisClient.del(room_id);
        }

        // Leave the socket room
        socket.leave(room_id);

        // Broadcast to remaining users that this user has left
        socket.to(room_id).emit('user_left', {
            socket_id: socket.id,
            username: username
        });

        // Optional: Acknowledge the room leave
        if (callback) {
            callback({
                status: 'left',
                room_id: room_id
            });
        }

        console.log(`User ${username} left room ${room_id}`);
    } catch (error) {
        console.error('Error handling room leave:', error);

        if (callback) {
            callback({
                status: 'error',
                message: 'Failed to leave room'
            });
        }
    }
};

// Modified handleDisconnection to remove user from room
const handleDisconnection = async (socket) => {
    console.log('VC client disconnected:', { socketId: socket.id });

    try {
        // Find and remove the user from all rooms
        const keys = await redisClient.keys('*');

        for (const key of keys) {
            const existingUsersJson = await redisClient.get(key);
            const existingUsers = existingUsersJson ? JSON.parse(existingUsersJson) : [];

            // Check if this socket was in this room
            const userInRoom = existingUsers.find(u => u?.socket_id === socket.id);

            if (userInRoom) {
                // Remove the user from the room
                const updatedUsers = existingUsers.filter(u => u?.socket_id !== socket.id);

                // Update Redis
                if (updatedUsers.length > 0) {
                    await redisClient.set(key, JSON.stringify(updatedUsers));
                } else {
                    await redisClient.del(key);
                }

                // Broadcast to remaining users that this user has disconnected
                socket.to(key).emit('user_left', {
                    socket_id: socket.id,
                    username: userInRoom.username
                });
            }
        }
    } catch (error) {
        console.error('Error handling disconnection:', error);
    }
};

module.exports = {
    handleConnection,
    handleDisconnection,
    handleRoomJoin
};