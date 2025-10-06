const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Member = require('../models/memberModel');

/**
 * Initializes the Socket.IO server and handles all real-time events.
 * @param {http.Server} server - The HTTP server instance to attach Socket.IO to.
 */
const initializeSocket = (server) => {
    // Initialize Socket.IO with CORS settings to allow your frontend to connect
    const io = socketIo(server, {
        cors: {
            origin: "http://localhost:5173", // Your Vite frontend URL
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware for authenticating socket connections using a JWT
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify the JWT token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Fetch the member from the database to ensure they exist
            const member = await Member.findById(decoded.member.id).select('name email');
            
            if (!member) {
                return next(new Error('Authentication error: Member not found'));
            }

            // Attach member information to the socket object for use in event handlers
            socket.memberId = member._id.toString();
            socket.memberName = member.name;
            socket.memberEmail = member.email;
            
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    // Main connection handler that runs when a client connects
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.memberName} (${socket.memberId})`);

        // Handler for when a user joins the main network room
        socket.on('join_network', () => {
            socket.join('network_room');
            
            // Notify all other users in the room that a new user has joined
            socket.to('network_room').emit('user_joined', {
                memberName: socket.memberName,
                memberId: socket.memberId,
                timestamp: new Date().toISOString()
            });

            console.log(`${socket.memberName} joined network room`);
        });

        // Handler for receiving and broadcasting chat messages
        socket.on('send_message', (data) => {
            const messageData = {
                message: data.message,
                memberName: socket.memberName,
                memberId: socket.memberId,
                timestamp: new Date().toISOString()
            };

            // Broadcast the message to everyone in the room (including the sender)
            io.to('network_room').emit('receive_message', messageData);
            
            console.log(`Message from ${socket.memberName}: ${data.message}`);
        });

        // Handler for broadcasting that a user is typing
        socket.on('typing', () => {
            socket.to('network_room').emit('user_typing', {
                memberName: socket.memberName,
                memberId: socket.memberId
            });
        });

        // Handler for broadcasting that a user has stopped typing
        socket.on('stop_typing', () => {
            socket.to('network_room').emit('user_stop_typing', {
                memberId: socket.memberId
            });
        });

        // Handler for when a user disconnects
        socket.on('disconnect', () => {
            // Check if the memberName exists to avoid errors on unauthenticated disconnects
            if (socket.memberName) {
                socket.to('network_room').emit('user_left', {
                    memberName: socket.memberName,
                    memberId: socket.memberId,
                    timestamp: new Date().toISOString()
                });
                console.log(`User disconnected: ${socket.memberName}`);
            } else {
                console.log('An unauthenticated user disconnected.');
            }
        });
    });

    return io;
};

module.exports = { initializeSocket };
