const { text } = require('express');
const mongoose = require('mongoose');

// Keeping it restricted to 1-1 messaging for now
const arrayLimit = (val) => {
    return val.length === 2; 
  };

// Chat Schema
const chatSchema = new mongoose.Schema({
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: [arrayLimit, '{PATH} must contain exactly 2 participants'], 
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage',
        required: false
    },
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
    chatId: {
        type: mongoose.Schema.Types.ObjectId,    
        ref: 'Chat',
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: false
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    attachments: [{
        type: String, // Storing the file path or URL
        required: false
    }],
    isDelivered: {
        type: Boolean,
        default: false
    },
    isSeen: {
        type: Boolean,
        default: false
    }
});

// Exporting the models
const Chat = mongoose.model('Chat', chatSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = { Chat, ChatMessage };
