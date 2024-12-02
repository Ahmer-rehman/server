const mongoose = require('mongoose');

// Chat Schema
const chatSchema = new mongoose.Schema({
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    file: {
        type: String, // Storing the file path or URL
        required: false
    }
});

// Exporting the models
const Chat = mongoose.model('Chat', chatSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = { Chat, ChatMessage };
