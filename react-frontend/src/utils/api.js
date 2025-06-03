import axios from "axios";
import endpoints from "../config/api";

const api = axios.create({
  withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      // Add user ID to socket.io authentication
      if (config.url?.includes("socket.io")) {
        config.auth = {
          userId: userData._id,
        };
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear user data if unauthorized
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
