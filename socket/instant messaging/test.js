const io = require('socket.io-client');
const readline = require('readline');
const SERVER_URL = 'https://cc9d-182-180-55-138.ngrok-free.app';
const tokenB = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGRhMDhmZGNmYjE3OGQwOGIyOTlhMyIsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE3MzMzNzkyNzEsImV4cCI6MTczMzQ2NTY3MX0.RyM1_gTOLMZQk78tibO3a4bAE86nkNcXsrydZtfJ_xA';

const socketB = io(`${SERVER_URL}/im`, {
    query: { token: tokenB }
});

// Setup readline for terminal input
const rlB = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let activeConversationIdB = null;

socketB.on('connect', () => {
    console.log(`Test connected.`);
    const participantIdA = '675027da20b5eb9a7cfe4a92';
    
    socketB.emit('checkConversation', { participantId: participantIdA });
    socketB.on('conversationCheckResponse', (data) => {
        if (data.exists) {
            console.log(`Conversation exists with ID: ${data.conversationId}`);
            activeConversationIdB = data.conversationId;
            socketB.emit('joinRoom', activeConversationIdB);
            promptMessageB();
        } else {
            console.log('No existing conversation found. Creating a new conversation...');
            socketB.emit('createConversation', { participantId: participantIdA });
        }
    });

    socketB.on('chatRoomCreated', (conversationId) => {
        console.log(`Chat room created with ID: ${conversationId}`);
        activeConversationIdB = conversationId;
        promptMessageB();
    });

    socketB.on('receiveMessage', (msg) => {
        console.log(`\nUser B received: ${msg.message}`);
        socketB.emit('markAsSeen', { messageId: msg.messageId, conversationId: msg.conversationId });
        promptMessageB();
    });
});

function promptMessageB() {
    if (activeConversationIdB) {
        rlB.question('Test, type your message: ', (message) => {
            if (message.trim()) {
                sendMessageB(message, activeConversationIdB);
            }
            promptMessageB();
        });
    } else {
        console.log('Waiting for conversation ID...');
    }
}

function sendMessageB(content, conversationId) {
    socketB.emit('sendMessage', { conversationId, message: content });
}

socketB.on('disconnect', (reason) => {
    console.log(`User B disconnected. Reason: ${reason}`);
    rlB.close();
});

