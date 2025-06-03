const API_BASE_URL = "http://localhost:5000/api";
const FRONTEND_URL = "http://localhost:3000";
export const SOCKET_URL = "http://localhost:5000";

export const endpoints = {
  // Auth endpoints
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  updateBio: `${API_BASE_URL}/auth/update-bio`,
  updatePassword: `${API_BASE_URL}/auth/update-password`,
  checkAuth: `${API_BASE_URL}/auth/check`,
  logout: `${API_BASE_URL}/auth/logout`,

  // Chat endpoints
  friends: `${API_BASE_URL}/chat/friends`,
  friendRequests: `${API_BASE_URL}/chat/friend-requests`,
  sendFriendRequest: `${API_BASE_URL}/chat/friend-request`,
  respondToFriendRequest: (requestId) =>
    `${API_BASE_URL}/chat/friend-request/${requestId}`,
  privateMessages: (friendId) => `${API_BASE_URL}/chat/messages/${friendId}`,
  globalMessages: `${API_BASE_URL}/chat/global`,
};

export { FRONTEND_URL };
export default endpoints;
