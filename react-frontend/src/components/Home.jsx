import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import endpoints from '../config/api';
import Navbar from './layout/Navbar';
import FriendsList from './chat/FriendsList';
import RequestsList from './chat/RequestsList';
import PrivateChat from './chat/PrivateChat';
import GlobalChat from './chat/GlobalChat';

export default function Home() {
  const location = useLocation();
  const [chatType, setChatType] = useState(location.state?.chatType || 'private');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    if (location.state?.chatType) {
      setChatType(location.state.chatType);
    }
  }, [location.state?.chatType]);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await api.get(endpoints.friends);
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get(endpoints.friendRequests);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.put(endpoints.respondToFriendRequest(requestId), {
        status: 'accepted'
      });
      fetchFriends();
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.put(endpoints.respondToFriendRequest(requestId), {
        status: 'rejected'
      });
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <Navbar onChatTypeChange={setChatType} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Fixed width, scrollable content */}
        <div className="w-80 flex-shrink-0 border-r flex flex-col bg-gray-50">
          {/* Toggle buttons - Fixed at top */}
          <div className="flex border-b bg-gray-50">
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                !showRequests ? 'bg-white text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setShowRequests(false)}
            >
              Friends
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                showRequests ? 'bg-white text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setShowRequests(true)}
            >
              Requests {requests.length > 0 && (
                <span className="ml-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {requests.length}
                </span>
              )}
            </button>
          </div>

          {/* Friends or Requests List - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {showRequests ? (
              <RequestsList
                requests={requests}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
              />
            ) : (
              <FriendsList
                friends={friends}
                selectedFriend={selectedFriend}
                onSelectFriend={setSelectedFriend}
              />
            )}
          </div>
        </div>

        {/* Main Chat Area - Flexible width, maintains scroll position */}
        <div className="flex-1 flex flex-col min-w-0">
          {chatType === 'private' ? (
            selectedFriend ? (
              <PrivateChat friend={selectedFriend} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a friend to start chatting
              </div>
            )
          ) : (
            <GlobalChat onSendRequest={fetchRequests} />
          )}
        </div>
      </div>
    </div>
  );
} 