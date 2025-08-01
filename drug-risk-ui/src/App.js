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
import NurseDashboard from "./pages/NurseDashboard"; 
import { isAuthenticated, getRole, logout } from "./authService"; 

function AppWrapper({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage =
    location.pathname === "/" || location.pathname === "/login";

  useEffect(() => {
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
          "/nurse", 
        ];
        const path = `/${role}`; 
        if (!validPaths.includes(location.pathname)) {
          navigate(path); 
        }
      } else {
        navigate("/unauthorized");
      }
    } else if (!isLoginPage && location.pathname !== "/patient/signup") {
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
            logout(); 
            setUser(null); 
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
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
