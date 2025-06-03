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
      // Verify the session immediately after login
      const response = await api.get(endpoints.checkAuth, {
        withCredentials: true,
      });

      console.log("CheckAuth Response:", response.data);
      console.log("Session Cookie:", document.cookie);

      if (response.data.authenticated) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        console.error("Authentication check failed:", response.data);
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Login verification error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
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
