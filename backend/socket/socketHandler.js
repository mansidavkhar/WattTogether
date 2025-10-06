const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Member = require('../models/memberModel');
const Message = require('../models/messageModel'); // Import the Message model

// Use a Map to store online users: { memberId -> socketId }
// This is more efficient for lookups and deletions than an array or object.
const onlineUsers = new Map();

/**
 * Verifies the JWT token from the socket handshake and attaches member data.
 * This is a custom middleware for Socket.IO.
 */
const verifySocketToken = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const member = await Member.findById(decoded.member.id).select('name email');
        
        if (!member) {
            return next(new Error('Authentication error: Member not found'));
        }

        // Attach a clean 'member' object to the socket for easy access.
        socket.member = {
            id: member._id.toString(),
            name: member.name,
            email: member.email
        };
        
        next();
    } catch (error) {
        console.error('Socket authentication error:', error.message);
        return next(new Error('Authentication error: Invalid token'));
    }
};

/**
 * Initializes the Socket.IO server and handles all real-time events.
 * @param {http.Server} server - The HTTP server instance to attach Socket.IO to.
 */
const initializeSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "http://localhost:5173", // Your Vite frontend URL
            methods: ["GET", "POST"]
        }
    });

    // Use the custom authentication middleware for all incoming connections
    io.use(verifySocketToken);

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.member.name} (${socket.member.id})`);

        // --- PRESENCE SYSTEM ---

        // 1. Add the newly connected user to our online users map
        onlineUsers.set(socket.member.id, socket.id);

        // 2. Broadcast the updated list of online user IDs to ALL connected clients
        io.emit('online_users_updated', Array.from(onlineUsers.keys()));

        // --- PRIVATE MESSAGING SYSTEM ---

        socket.on('send_private_message', async (data) => {
            const { recipientId, content } = data;
            
            try {
                // 1. Save the message to the database
                const newMessage = new Message({
                    sender: socket.member.id,
                    recipient: recipientId,
                    content: content
                });
                const savedMessage = await newMessage.save();

                // 2. Find the recipient's socket ID from our map
                const recipientSocketId = onlineUsers.get(recipientId);

                // 3. If the recipient is currently online, send the message directly to them
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('receive_private_message', savedMessage);
                }
                
                // 4. Send the message back to the sender as well, to confirm it was sent
                // and to update their UI with the final message object from the database (with _id, timestamps, etc.)
                socket.emit('receive_private_message', savedMessage);

            } catch (error) {
                console.error('Error handling private message:', error);
                // Optionally, emit an error event back to the sender
                socket.emit('message_error', { message: 'Could not send message.' });
            }
        });

        // --- DISCONNECT HANDLING ---

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.member.name}`);
            
            // 1. Remove the user from the online users map
            onlineUsers.delete(socket.member.id);

            // 2. Broadcast the updated online users list to everyone
            io.emit('online_users_updated', Array.from(onlineUsers.keys()));
        });
    });

    return io;
};

module.exports = { initializeSocket };
