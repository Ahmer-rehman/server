const io = require('socket.io-client');
const readline = require('readline');
const SERVER_URL = 'https://cc9d-182-180-55-138.ngrok-free.app';
const tokenA = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NTAyN2RhMjBiNWViOWE3Y2ZlNGE5MiIsImVtYWlsIjoiYm90QGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiYm90IiwiaWF0IjoxNzMzMzc5MjI2LCJleHAiOjE3MzM0NjU2MjZ9.2DB6JB5JRtt4Ez77xdk_fUH6mBavg4tAqpOR_z6SHEE';

const socketA = io(`${SERVER_URL}/im`, {
    query: { token: tokenA }
});

// Setup readline for terminal input
const rlA = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let activeConversationIdA = null;

socketA.on('connect', () => {
    console.log(`Bot connected`);
    const participantIdB = '674da08fdcfb178d08b299a3'; 
    
    socketA.emit('checkConversation', { participantId: participantIdB });
    socketA.on('conversationCheckResponse', (data) => {
        if (data.exists) {
            console.log(`Conversation exists with ID: ${data.conversationId}`);
            activeConversationIdA = data.conversationId;
            socketA.emit('joinRoom', activeConversationIdA);
            promptMessageA();
        } else {
            console.log('No existing conversation found. Creating a new conversation...');
            socketA.emit('createConversation', { participantId: participantIdB });
        }
    });

    socketA.on('chatRoomCreated', (conversationId) => {
        console.log(`Chat room created with ID: ${conversationId}`);
        activeConversationIdA = conversationId;
        promptMessageA();
    });

    socketA.on('receiveMessage', (msg) => {
        console.log(`\nUser A received: ${msg.message}`);
        socketA.emit('markAsSeen', { messageId: msg.messageId, conversationId: msg.conversationId });
        promptMessageA();
    });
});

function promptMessageA() {
    if (activeConversationIdA) {
        rlA.question('Bot, type your message: ', (message) => {
            if (message.trim()) {
                sendMessageA(message, activeConversationIdA);
            }
            promptMessageA();
        });
    } else {
        console.log('Waiting for conversation ID...');
    }
}

function sendMessageA(content, conversationId) {
    socketA.emit('sendMessage', { conversationId, message: content });
    console.log(`User A sent: ${content}`);
}

socketA.on('disconnect', (reason) => {
    console.log(`User A disconnected. Reason: ${reason}`);
    rlA.close();
});

