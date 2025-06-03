import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import endpoints from "../config/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      try {
        // Check if user exists in localStorage
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          // Verify session with backend
          const response = await api.get(endpoints.checkAuth, {
            withCredentials: true,
          });

          if (response.data.authenticated) {
            setUser(JSON.parse(storedUser));
          } else {
            // If session is invalid, clear localStorage
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Session verification error:", error);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (userData) => {
    try {
      console.log("Starting login verification...");
      console.log("UserData received:", userData);

      // Store user data first
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      // Add a small delay before checking auth
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify the session
      const response = await api.get(endpoints.checkAuth, {
        withCredentials: true,
      });

      console.log("CheckAuth Full Response:", {
        data: response.data,
        status: response.status,
        headers: response.headers,
      });

      const cookies = document.cookie;
      console.log("All Cookies:", cookies);

      if (!response.data.authenticated) {
        console.error(
          "Authentication check failed. Full response:",
          response.data
        );
        setUser(null);
        localStorage.removeItem("user");
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Login verification error details:", {
        message: error.message,
        response: error.response
          ? {
              data: error.response.data,
              status: error.response.status,
              headers: error.response.headers,
            }
          : "No response object",
        stack: error.stack,
      });
      setUser(null);
      localStorage.removeItem("user");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post(endpoints.logout);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
