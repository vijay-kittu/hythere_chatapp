import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import moment from 'moment';
import api from '../../utils/api';
import endpoints, { SOCKET_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function GlobalChat({ onSendRequest }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();

  useEffect(() => {
    if (!user) return; // Don't connect if no user

    // Connect to socket.io with credentials
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true
    });

    // Listen for global messages
    socketRef.current.on('global_message', (message) => {
      if (message && message.sender) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Fetch global chat history
    fetchMessages();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]); // Depend on user

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(endpoints.globalMessages);
      if (Array.isArray(response.data)) {
        setMessages(response.data);
      } else {
        console.error('Invalid messages data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const behavior = messages.length <= 1 ? 'auto' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    const formData = new FormData();
    if (newMessage.trim()) {
      formData.append('text', newMessage.trim());
    }
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    try {
      const response = await api.post(endpoints.globalMessages, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Clear the form
      setNewMessage('');
      setSelectedImage(null);

      // Update messages locally only if the response has the correct structure
      if (response.data && response.data.sender) {
        setMessages(prev => [...prev, response.data]);
        // Emit message through socket only if it's valid
        socketRef.current?.emit('global_message', response.data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleUserClick = (clickedUser) => {
    if (!user || !clickedUser || clickedUser._id === user._id) return;
    setSelectedUser(clickedUser);
    setShowRequestModal(true);
  };

  const sendFriendRequest = async () => {
    if (!selectedUser) return;
    try {
      await api.post(endpoints.sendFriendRequest, {
        receiverId: selectedUser._id
      });
      onSendRequest();
      setShowRequestModal(false);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access the chat.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Header - Fixed at top */}
      <div className="px-6 py-4 border-b bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-900">Global Chat</h2>
        <p className="text-sm text-gray-500">Click on a user to send friend request</p>
      </div>

      {/* Messages - Scrollable container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => {
          // Skip rendering if message or sender is missing
          if (!message || !message.sender) return null;
          
          return (
            <div
              key={message._id}
              className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.sender._id === user._id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <button
                  onClick={() => handleUserClick(message.sender)}
                  className={`text-xs font-medium mb-1 ${
                    message.sender._id === user._id
                      ? 'text-blue-100'
                      : 'text-blue-600'
                  }`}
                >
                  {message.sender.fullName}
                </button>
                {message.content?.text && (
                  <p className="text-sm">{message.content.text}</p>
                )}
                {message.content?.image && (
                  <img
                    src={`${SOCKET_URL}${message.content.image}`}
                    alt="Message attachment"
                    className="mt-2 max-w-full rounded"
                    loading="lazy"
                  />
                )}
                <p className="text-xs mt-1 opacity-75">
                  {moment(message.createdAt).format('LT')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="border-t bg-white">
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center justify-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </div>
          {selectedImage && (
            <div className="mt-2 flex items-center">
              <span className="text-sm text-gray-500">
                Image selected: {selectedImage.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="ml-2 text-red-500 text-sm hover:text-red-600"
              >
                Remove
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Friend Request Modal */}
      {showRequestModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900">Send Friend Request</h3>
            <p className="mt-2 text-sm text-gray-500">
              Do you want to send a friend request to {selectedUser.fullName}?
            </p>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={sendFriendRequest}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Request
              </button>
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 