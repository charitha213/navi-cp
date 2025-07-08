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
import ProductionChecker from "./pages/ProductionChecker";
import ManagerDashboard from "./pages/ManagerDashboard";
import NotFound from "./pages/NotFound";

function AppWrapper({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage =
    location.pathname === "/" || location.pathname === "/login";

  useEffect(() => {
    if (user) {
      if (user.role === "doctor") navigate("/doctor");
      else if (user.role === "admin") navigate("/admin");
      else if (user.role === "production") navigate("/production");
      else if (user.role === "manager") navigate("/manager")
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <>
      {!isLoginPage && (
        <Navbar
          isLoggedIn={!!user}
          role={user?.role}
          onLogout={() => setUser(null)}
        />
      )}
      <Routes>
        <Route path="/" element={<LoginPage onLogin={setUser} />} />
        <Route path="/login" element={<LoginPage onLogin={setUser} />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/prodcheck" element={<ProductionChecker />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <AppWrapper user={user} setUser={setUser} />
    </BrowserRouter>
  );
}
