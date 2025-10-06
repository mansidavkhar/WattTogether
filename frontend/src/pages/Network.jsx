

// const Network = () => {
//     return (
//         <div>
//             <h1>Network Page</h1>
//             <p>Welcome to the Network page.</p>
//         </div>
//     );
// };


// export default Network;








import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';


const Network = () => {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);


    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };


    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // Initialize Socket.IO connection
    useEffect(() => {
        const token = localStorage.getItem('token');
       
        if (!token) {
            console.error('No authentication token found');
            return;
        }


        const newSocket = io('http://localhost:5000', {
            auth: {
                token: token
            }
        });


        newSocket.on('connect', () => {
            console.log('Connected to Socket.IO server');
            setIsConnected(true);
            newSocket.emit('join_network');
        });


        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            setIsConnected(false);
        });


        newSocket.on('receive_message', (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });


        newSocket.on('user_joined', (data) => {
            const notification = {
                type: 'system',
                message: `${data.memberName} joined the network`,
                timestamp: data.timestamp
            };
            setMessages((prevMessages) => [...prevMessages, notification]);
        });


        newSocket.on('user_left', (data) => {
            const notification = {
                type: 'system',
                message: `${data.memberName} left the network`,
                timestamp: data.timestamp
            };
            setMessages((prevMessages) => [...prevMessages, notification]);
        });


        newSocket.on('user_typing', (data) => {
            setTypingUsers((prev) => new Set(prev).add(data.memberName));
        });


        newSocket.on('user_stop_typing', (data) => {
            setTypingUsers((prev) => {
                const updated = new Set(prev);
                const userToRemove = Array.from(updated).find(() => true);
                updated.delete(userToRemove);
                return updated;
            });
        });


        newSocket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
            setIsConnected(false);
        });


        setSocket(newSocket);


        return () => {
            newSocket.close();
        };
    }, []);


    // Handle message send
    const handleSendMessage = (e) => {
        e.preventDefault();
       
        if (message.trim() && socket && isConnected) {
            socket.emit('send_message', { message: message.trim() });
            setMessage('');
           
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            socket.emit('stop_typing');
        }
    };


    // Handle typing indicator
    const handleTyping = (e) => {
        setMessage(e.target.value);
       
        if (!socket || !isConnected) return;


        socket.emit('typing');


        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }


        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing');
        }, 2000);
    };


    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-screen flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900">WattTogether Network</h1>
               
                <div className="flex items-center gap-2">
                    <span
                        className={`w-3 h-3 rounded-full ${
                            isConnected
                                ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
                                : 'bg-red-500'
                        }`}
                    ></span>
                    <span className={`text-sm font-medium ${
                        isConnected ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>


            {/* Chat Container */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                <p className="text-gray-500 text-lg">No messages yet</p>
                                <p className="text-gray-400 text-sm mt-2">Start the conversation!</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, index) => (
                                <div key={index}>
                                    {msg.type === 'system' ? (
                                        <div className="flex justify-center my-4">
                                            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
                                                {msg.message}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 max-w-3xl">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                    {msg.memberName.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                           
                                            {/* Message Content */}
                                            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-blue-600 text-sm">
                                                        {msg.memberName}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-800 text-sm leading-relaxed break-words">
                                                    {msg.message}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                           
                            {/* Typing Indicator */}
                            {typingUsers.size > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 italic ml-12">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span>
                                        {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                                    </span>
                                </div>
                            )}
                           
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>


                {/* Message Input */}
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={message}
                            onChange={handleTyping}
                            placeholder={isConnected ? "Type your message..." : "Disconnected..."}
                            disabled={!isConnected}
                            className={`flex-1 px-4 py-3 rounded-full border ${
                                isConnected
                                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                    : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                            } outline-none transition-all text-sm`}
                        />
                       
                        <button
                            type="submit"
                            disabled={!isConnected || !message.trim()}
                            className={`px-6 py-3 rounded-full font-medium text-white transition-all duration-200 flex items-center gap-2 ${
                                !isConnected || !message.trim()
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:scale-105'
                            }`}
                        >
                            <span>Send</span>
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};


export default Network;


