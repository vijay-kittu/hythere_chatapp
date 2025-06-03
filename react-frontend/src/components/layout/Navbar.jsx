import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onChatTypeChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState('private');

  const handleChatChange = (type) => {
    setActiveChat(type);
    if (onChatTypeChange) {
      onChatTypeChange(type);
    } else {
      // If onChatTypeChange is not provided, navigate to home
      navigate('/', { state: { chatType: type } });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                Hythere!
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleChatChange('private')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeChat === 'private'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Private Chat
            </button>
            <button
              onClick={() => handleChatChange('global')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeChat === 'global'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Global Chat
            </button>
            <Link
              to="/profile"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 