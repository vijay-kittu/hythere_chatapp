export default function RequestsList({ requests, onAccept, onReject }) {
  return (
    <div className="divide-y divide-gray-200">
      {requests.map((request) => (
        <div key={request._id} className="px-4 py-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {request.sender.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {request.sender.fullName}
              </p>
              <p className="text-xs text-gray-500">{request.sender.email}</p>
            </div>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => onAccept(request._id)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
            >
              Accept
            </button>
            <button
              onClick={() => onReject(request._id)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
      {requests.length === 0 && (
        <div className="px-4 py-6 text-center text-gray-500">
          No pending friend requests
        </div>
      )}
    </div>
  );
} 