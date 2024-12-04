const socketIO = require('socket.io');
const { verifyTokenForRTC } = require('../../rest/authentication/Controllers'); 
const Chat = require('../../models/instant messaging/Models'); 
const User = require('../../models/authentication/Models');

// Establish the connection
const handleConnection = (io, socket) => {
    const token = socket.handshake.query.token;
    if (!token) {
        return socket.emit('error', { message: 'Authentication token is required' });
    }

    // Verify token and retrieve user data
    const userData = verifyTokenForRTC(token);
    if (!userData) {
        return socket.emit('error', { message: 'Authentication failed' });
    }

    // Store user data on the socket object
    socket.user = { user_id: userData.id, username: userData.username, profilePic: userData.profilePic };

    // Emit user connection event
    socket.emit('user_connected', {
        socketId: socket.id,
        username: socket.user.username,
        profilePic: socket.user.profilePic
    });

    console.log('New IM client connected:', { socketId: socket.id, username: socket.user.username });
};

// Handle disconnection
const handleDisconnection = (io, socket) => {
    // Log out the user and leave any rooms they are in
    socket.rooms.forEach((room) => {
        socket.leave(room);
        console.log(`User ${socket.user.username} left room: ${room}`);
    });

    console.log('IM client disconnected:', { socketId: socket.id, username: socket.user.username });
};

// Message handling for sending and receiving messages
const handleMessage = (io, socket, data, callback) => {
    try {
        const { chatId, message } = data; 

        // Generate timestamp for the message
        const timestamp = new Date().toISOString();

        // Broadcast the message to the room (1-1 chat room based on chatId)
        io.to(chatId).emit('message', {
            messageId: new Date().getTime(), // Simple unique messageId
            senderId: socket.user.user_id,
            message,
            timestamp
        });

        // Send an acknowledgment to the sender
        if (callback) {
            callback({
                status: 'received',
                messageId: 'Your message has been received'
            });
        }
    } catch (error) {
        console.error('IM message handling error:', error);

        // Send error acknowledgment if something goes wrong
        if (callback) {
            callback({
                status: 'error',
                message: 'Failed to process IM message'
            });
        }
    }
};

// --- TYPING HANDLING ---
const handleTyping = (io, socket, chatId) => { // Changed 'conversationId' to 'chatId'
    socket.to(chatId).emit('typing', {
        senderId: socket.user.user_id,
        username: socket.user.username
    });
};

// --- MARK AS SEEN HANDLING ---
const handleMarkAsSeen = (io, socket, messageId, chatId) => { // Changed 'conversationId' to 'chatId'
    // Notify the room that the message has been seen
    io.to(chatId).emit('message_seen', {
        messageId,
        seenBy: socket.user.user_id
    });
};

// --- CREATE OR JOIN ROOM HANDLING ---
const handleCreateOrJoinRoom = async (io, socket, participantId) => {
    // Fetch or create chatId between the two participants
    const chatId = await getChatId(socket.user.user_id, participantId); // Changed 'conversationId' to 'chatId'

    // Join the room (chatId)
    socket.join(chatId);
    console.log(`User ${socket.user.username} joined room: ${chatId}`);

    // Emit a message to the room about the user joining
    io.to(chatId).emit('user_joined', {
        userId: socket.user.user_id,
        username: socket.user.username
    });
};

// --- GET CHAT ID ---
const getChatId = async (userId1, userId2) => { // Changed 'getConversationId' to 'getChatId'
    const participants = [userId1, userId2].sort(); // Sorting for consistency
    const chat = await Chat.findOne({ // Changed 'Conversation' to 'Chat'
        participants: { $all: participants },
        $expr: { $eq: [{ $size: "$participants" }, 2] }
    });

    if (chat) {
        return chat._id.toString(); // Return existing chatId
    } else {
        // Create a new chat if it doesn't exist
        const newChat = await Chat.create({ // Changed 'Conversation' to 'Chat'
            participants: [userId1, userId2]
        });
        return newChat._id.toString();
    }
};

// --- INITIALIZING SOCKET.IO SERVER ---
const initSocket = (server) => {
    const io = socketIO(server);

    // Socket connection event
    io.on('connection', (socket) => {
        console.log('New connection:', socket.id);

        // Handle user connection
        handleConnection(io, socket);

        // Handle message sending
        socket.on('send_message', (data, callback) => {
            handleMessage(io, socket, data, callback);
        });

        // Handle typing event
        socket.on('typing', (chatId) => { // Changed 'conversationId' to 'chatId'
            handleTyping(io, socket, chatId);
        });

        // Handle mark as seen event
        socket.on('mark_as_seen', (messageId, chatId) => { // Changed 'conversationId' to 'chatId'
            handleMarkAsSeen(io, socket, messageId, chatId);
        });

        // Handle creating or joining a chat room
        socket.on('create_or_join_room', (participantId) => {
            handleCreateOrJoinRoom(io, socket, participantId);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            handleDisconnection(io, socket);
        });
    });
};

module.exports = {
    initSocket,
    handleMessage,
    handleConnection,
    handleDisconnection,
    handleTyping,
    handleMarkAsSeen,
    handleCreateOrJoinRoom
};
