import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import moment from 'moment';
import api from '../../utils/api';
import endpoints, { SOCKET_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function PrivateChat({ friend }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();

  useEffect(() => {
    if (!user || !friend) return;

    // Connect to socket.io with credentials
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true
    });

    // Listen for private messages
    socketRef.current.on('private_message', (message) => {
      if (message.from === friend._id) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Fetch chat history
    fetchMessages();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [friend._id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(endpoints.privateMessages(friend._id));
      if (Array.isArray(response.data)) {
        setMessages(response.data);
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
      const response = await api.post(
        endpoints.privateMessages(friend._id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Clear form
      setNewMessage('');
      setSelectedImage(null);

      // Update messages locally
      if (response.data) {
        setMessages(prev => [...prev, response.data]);

        // Emit message through socket
        socketRef.current?.emit('private_message', {
          to: friend._id,
          message: response.data
        });
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

  if (!user || !friend) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Please select a friend to chat with.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Header - Fixed at top */}
      <div className="px-6 py-4 border-b flex items-center bg-white z-10">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-medium">
            {friend.fullName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{friend.fullName}</p>
          <p className="text-xs text-gray-500">{friend.email}</p>
        </div>
      </div>

      {/* Messages - Scrollable container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender === user._id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.sender === user._id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
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
        ))}
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
    </div>
  );
} 