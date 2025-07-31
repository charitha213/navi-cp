import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import ProductionPage from "./pages/ProductionPage";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import PatientDashboard from "./pages/PatientDashboard";
import PatientSignUp from "./pages/PatientSignUp";
import NurseDashboard from "./pages/NurseDashboard"; // Import NurseDashboard
import { isAuthenticated, getRole, logout } from "./authService"; // Ensure auth utilities are imported

function AppWrapper({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage =
    location.pathname === "/" || location.pathname === "/login";

  useEffect(() => {
    // Check authentication state and role on mount or user change
    if (isAuthenticated()) {
      const role = getRole();
      if (role) {
        const validPaths = [
          "/doctor",
          "/production",
          "/admin",
          "/manager",
          "/profile",
          "/patient",
          "/nurse", // Add nurse route
        ];
        const path = `/${role}`; // Default to role-based path
        if (!validPaths.includes(location.pathname)) {
          navigate(path); // Redirect to role-based path if on invalid route
        }
      } else {
        // If role is null but authenticated, redirect to login or unauthorized
        navigate("/unauthorized");
      }
    } else if (!isLoginPage && location.pathname !== "/patient/signup") {
      // If not authenticated and not on login or signup page, redirect to login
      navigate("/login");
    }
  }, [user, navigate, location.pathname]);

  return (
    <>
      {!isLoginPage && location.pathname !== "/patient/signup" && (
        <Navbar
          isLoggedIn={isAuthenticated()}
          role={getRole()}
          onLogout={() => {
            logout(); // Clear token and headers
            setUser(null); // Clear user state
            navigate("/login");
          }}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={
            <LoginPage
              onLogin={(redirectPath) =>
                setUser({ role: getRole() }) && navigate(redirectPath || "/")
              }
            />
          }
        />
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={(redirectPath) =>
                setUser({ role: getRole() }) && navigate(redirectPath || "/")
              }
            />
          }
        />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/signup" element={<PatientSignUp />} />
        <Route path="/nurse" element={<NurseDashboard />} />{" "}
        {/* Add NurseDashboard route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Initialize user state based on existing token on app load
    if (isAuthenticated()) {
      setUser({ role: getRole() });
    }
  }, []);

  return (
    <BrowserRouter>
      <AppWrapper user={user} setUser={setUser} />
    </BrowserRouter>
  );
}
