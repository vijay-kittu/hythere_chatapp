import axios from "axios";
import endpoints from "../config/api";

const api = axios.create({
  withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    config.headers = config.headers || {};

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
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired session and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to check authentication status
        const response = await axios.get(endpoints.checkAuth, {
          withCredentials: true,
        });

        if (!response.data.authenticated) {
          // If not authenticated, clear user data and redirect
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // If authenticated, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If check auth fails, clear user data and redirect
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
