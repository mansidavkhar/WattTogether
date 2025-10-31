import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;

const Network = () => {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('loading'); // loading, setup, discover, chat
    
    // Discover View State
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Chat View State
    const [connections, setConnections] = useState([]); // This will hold ACCEPTED connections
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    // Socket & Presence State
    const [socket, setSocket] = useState(null);
    const [onlineUserIds, setOnlineUserIds] = useState(new Set());

    // Connection Requests State
    const [pendingRequests, setPendingRequests] = useState([]);
    
    const messagesEndRef = useRef(null);

    // Initial data fetch for the current user
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login or handle not logged in case
            return;
        }

        const fetchUserData = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/members/me`, {
                    headers: { 'x-auth-token': token }
                });
                const currentUser = res.data;
                setUser(currentUser);
                if (currentUser.profileSetupComplete) {
                    setView('discover');
                    // Pass user object to fetchConnections to avoid state dependency issue
                    fetchConnections(token, currentUser); 
                } else {
                    setView('setup');
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
                // Handle error, maybe redirect to login
            }
        };

        fetchUserData();
    }, []);

    // Socket connection and event listeners
    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('token');
            // Remove /api at the end if present (robust for prod/dev)
            const apiBase = import.meta.env.VITE_API_GATEWAY_URL.replace(/\/api\/?$/, '');
            const newSocket = io(apiBase, {
                auth: { token }
            });

            newSocket.on('connect', () => {
                console.log('Connected to Socket.IO for networking!');
            });
            
            newSocket.on('online_users_updated', (onlineIds) => {
                setOnlineUserIds(new Set(onlineIds));
            });

            newSocket.on('receive_private_message', (message) => {
                // Since the server sends the message back to the sender too,
                // we check if the active chat matches the message sender or recipient
                if (activeChat && (message.sender === activeChat._id || message.recipient === activeChat._id)) {
                     setMessages(prev => {
                        // Add a check to prevent rare duplicate renders
                        if (prev.find(m => m._id === message._id)) {
                            return prev;
                        }
                        return [...prev, message];
                    });
                }
            });
            
            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, [user, activeChat]);

    // Auto-scroll chat to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // --- API Call Functions ---

    const fetchMembers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${BACKEND_URL}/network/members?search=${searchTerm}`, {
                headers: { 'x-auth-token': token }
            });
            setMembers(res.data);
        } catch (error) {
            console.error("Failed to fetch members", error);
        }
    };
    
    const fetchConnections = async (token, currentUser) => {
        try {
            const res = await axios.get(`${BACKEND_URL}/network/connections`, {
                headers: { 'x-auth-token': token }
            });

            const allConnections = res.data;

            const incomingRequests = allConnections.filter(c => 
                c.status === 'pending' && c.recipient._id.toString() === currentUser._id
            );

            const accepted = allConnections
                .filter(c => c.status === 'accepted')
                .map(c => c.requester._id.toString() === currentUser._id ? c.recipient : c.requester);
            
            setPendingRequests(incomingRequests);
            setConnections(accepted);

        } catch (error) {
            console.error("Failed to fetch connections", error);
        }
    };
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await axios.put(`${BACKEND_URL}/network/profile`, {
                name: user.name,
                bio: user.bio,
                location: user.location
            }, { headers: { 'x-auth-token': token }});
            const updatedUser = res.data;
            setUser(updatedUser);
            setView('discover');
            fetchConnections(token, updatedUser);
        } catch (error) {
            console.error("Profile update failed", error);
        }
    };

    const handleConnect = async (recipientId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${BACKEND_URL}/network/connections/request/${recipientId}`, {}, {
                headers: { 'x-auth-token': token }
            });
            alert('Connection request sent!');
        } catch (error) {
            console.error('Failed to send connection request', error);
            alert(error.response?.data?.msg || 'Could not send request.');
        }
    };
    
    const handleRespondToRequest = async (requestId, response) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${BACKEND_URL}/network/connections/respond/${requestId}`, 
                { status: response },
                { headers: { 'x-auth-token': token } }
            );
            fetchConnections(token, user);
        } catch (error) {
            console.error('Failed to respond to request', error);
            alert('Could not respond to request.');
        }
    };

    const handleSelectChat = async (partner) => {
        setActiveChat(partner);
        setView('chat');
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${BACKEND_URL}/network/messages/${partner._id}`, {
                headers: { 'x-auth-token': token }
            });
            setMessages(res.data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket && activeChat) {
            socket.emit('send_private_message', {
                recipientId: activeChat._id,
                content: newMessage,
            });
            // FIX: The optimistic UI update that caused the duplicate has been removed.
            setNewMessage('');
        }
    };

    // --- Render Logic ---

    const renderContent = () => {
        switch (view) {
            case 'setup':
                return (
                    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl">
                        <h2 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h2>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="mb-4">
                                <label className="block text-gray-700">Name</label>
                                <input type="text" value={user.name || ''} onChange={e => setUser({...user, name: e.target.value})} className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700">Bio</label>
                                <textarea value={user.bio || ''} onChange={e => setUser({...user, bio: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="Tell us about yourself..."></textarea>
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700">Location</label>
                                <input type="text" value={user.location || ''} onChange={e => setUser({...user, location: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="City, Country" />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save and Continue</button>
                        </form>
                    </div>
                );
            
            case 'discover':
                return (
                    <div className="max-w-4xl mx-auto p-4">
                        <div className="text-center p-6 bg-gray-800 text-white rounded-lg mb-8">
                            <h1 className="text-4xl font-bold">Connect with the Likeminded!</h1>
                        </div>
                        <div className="flex gap-4 mb-6">
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search for individuals..." className="flex-grow p-3 border rounded-lg"/>
                            <button onClick={fetchMembers} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Search</button>
                            <button onClick={() => setView('chat')} className="px-6 py-3 bg-teal-500 text-white rounded-lg">Your Chats ({connections.length})</button>
                        </div>

                        {pendingRequests.length > 0 && (
                            <div className="my-8">
                                <h2 className="text-2xl font-bold mb-4">Connection Requests ({pendingRequests.length})</h2>
                                <div className="space-y-4">
                                    {pendingRequests.map(req => (
                                        <div key={req._id} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md">
                                            <div className="flex items-center gap-4">
                                                <img src={req.requester.profilePicture || `https://ui-avatars.com/api/?name=${req.requester.name}&background=random`} alt={req.requester.name} className="w-16 h-16 rounded-full"/>
                                                <div>
                                                    <h3 className="font-bold text-lg">{req.requester.name}</h3>
                                                    <p className="text-gray-600">Wants to connect with you.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => handleRespondToRequest(req._id, 'accepted')} className="px-5 py-2 bg-green-500 text-white rounded-full hover:bg-green-600">Accept</button>
                                                <button onClick={() => handleRespondToRequest(req._id, 'declined')} className="px-5 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600">Decline</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <hr className="my-8" />
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            {members.map(member => (
                                <div key={member._id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
                                    <div className="flex items-center gap-4">
                                        <img src={member.profilePicture || `https://ui-avatars.com/api/?name=${member.name}&background=random`} alt={member.name} className="w-16 h-16 rounded-full"/>
                                        <div>
                                            <h3 className="font-bold text-lg">{member.name}</h3>
                                            <p className="text-gray-600">{member.bio}</p>
                                            <p className="text-sm text-gray-500">{member.location}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleConnect(member._id)} className="px-5 py-2 bg-teal-500 text-white rounded-full">Connect</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            case 'chat':
                 return (
                    <div className="flex h-[calc(100vh-100px)] border rounded-lg bg-white shadow-lg">
                        <div className="w-1/3 border-r flex flex-col">
                            <div className="p-4 border-b">
                                <button onClick={() => setView('discover')} className="text-blue-600 hover:underline">← Back to Discover</button>
                                <h2 className="font-bold text-lg mt-2">People</h2>
                            </div>
                            <div className="overflow-y-auto">
                                {connections.map(c => {
                                    const isOnline = onlineUserIds.has(c._id);
                                    return (
                                        <div key={c._id} onClick={() => handleSelectChat(c)} className={`flex items-center justify-between gap-3 p-3 cursor-pointer ${activeChat?._id === c._id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <img src={c.profilePicture || `https://ui-avatars.com/api/?name=${c.name}&background=random`} alt={c.name} className="w-10 h-10 rounded-full" />
                                                <span>{c.name}</span>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} title={isOnline ? 'Online' : 'Offline'}></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="w-2/3 flex flex-col">
                            {activeChat ? (
                                <>
                                    <div className="p-4 border-b font-bold text-lg">{activeChat.name}</div>
                                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                                        {messages.map(msg => (
                                            <div key={msg._id} className={`flex ${msg.sender === user._id ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === user._id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2 bg-white">
                                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={`Message ${activeChat.name}...`} className="flex-grow p-2 border rounded-full" />
                                        <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-full">Send</button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">Select a connection to start chatting.</div>
                            )}
                        </div>
                    </div>
                );

            default:
                return <div>Loading Network...</div>;
        }
    };

    return <div className="p-4">{renderContent()}</div>;
};

export default Network;
