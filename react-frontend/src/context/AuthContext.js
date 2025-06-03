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
          let verified = false;
          let attempts = 0;
          const maxAttempts = 3;

          while (!verified && attempts < maxAttempts) {
            try {
              // Add increasing delay between attempts
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (attempts + 1))
              );

              console.log(
                `Initial verification attempt ${attempts + 1}/${maxAttempts}`
              );
              const response = await api.get(endpoints.checkAuth, {
                withCredentials: true,
              });

              if (response.data.authenticated) {
                console.log("Initial session verified successfully");
                setUser(JSON.parse(storedUser));
                verified = true;
                break;
              } else {
                console.log(
                  `Initial verification attempt ${attempts + 1} failed`
                );
              }
            } catch (verifyError) {
              console.log(
                `Initial verification attempt ${attempts + 1} error:`,
                verifyError
              );
            }
            attempts++;
          }

          if (!verified) {
            console.log("Failed to verify initial session, clearing user data");
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Initial session verification error:", error);
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

      // Try to verify the session multiple times
      let verified = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!verified && attempts < maxAttempts) {
        try {
          // Add increasing delay between attempts
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempts + 1))
          );

          console.log(`Verification attempt ${attempts + 1}/${maxAttempts}`);
          const response = await api.get(endpoints.checkAuth, {
            withCredentials: true,
          });

          console.log(`Attempt ${attempts + 1} response:`, {
            data: response.data,
            status: response.status,
            headers: response.headers,
          });

          if (response.data.authenticated) {
            console.log("Session verified successfully");
            verified = true;
            break;
          } else {
            console.log(`Attempt ${attempts + 1} failed, session not verified`);
          }
        } catch (verifyError) {
          console.log(`Attempt ${attempts + 1} error:`, verifyError);
        }
        attempts++;
      }

      if (!verified) {
        console.error(
          "Failed to verify session after",
          maxAttempts,
          "attempts"
        );
        setUser(null);
        localStorage.removeItem("user");
        throw new Error("Could not establish session after multiple attempts");
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
