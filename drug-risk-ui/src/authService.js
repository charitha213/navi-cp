import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const login = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/admin/token`, // Use common endpoint
      new URLSearchParams({
        username,
        password,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    const { access_token } = response.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("username", username); // Store username for role inference
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    return true;
  } catch (error) {
    console.error(
      "Login failed:",
      error.response?.data?.detail || error.message
    );
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  delete axios.defaults.headers.common["Authorization"];
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const getRole = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1])); // Decode base64 payload
      return payload.role || null; // Extract role from JWT
    } catch (e) {
      console.error("Invalid token format:", e);
      // Fallback to username-based role inference if JWT decoding fails
      const username = localStorage.getItem("username");
      if (username === "nurse") return "nurse";
      if (username === "pat") return "patient";
      if (username === "doc") return "doctor";
      return null;
    }
  }
  return null;
};

export const hasRole = (requiredRole) => {
  const role = getRole();
  return role === requiredRole;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
