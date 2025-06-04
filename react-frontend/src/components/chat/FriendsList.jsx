export default function FriendsList({ friends, selectedFriend, onSelectFriend }) {
  return (
    <div className="divide-y divide-gray-200">
      {friends.map((friend) => (
        <button
          key={friend._id}
          onClick={() => onSelectFriend(friend)}
          className={`w-full px-4 py-3 flex items-center hover:bg-gray-50 ${
            selectedFriend?._id === friend._id ? 'bg-blue-50' : ''
          }`}
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {friend.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 text-left">
            <p className="text-sm font-medium text-gray-900">{friend.fullName}</p>
            <p className="text-xs text-gray-500">{friend.bio}</p>
          </div>
        </button>
      ))}
      {friends.length === 0 && (
        <div className="px-4 py-6 text-center text-gray-500">
          No friends yet. Find friends in the global chat!
        </div>
      )}
    </div>
  );
} 