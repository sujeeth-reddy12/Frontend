import { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import api from "./api";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StaffDashboard from "./pages/StaffDashboard";
import UserDashboard from "./pages/UserDashboard";
import {
  clearUserSession,
  getStoredToken,
  getStoredUser,
  hasRequiredRole,
  hasValidUserId,
  persistUserSession,
} from "./utils/authStorage";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function isRecognizedRole(role) {
  return role === "USER" || role === "ADMIN" || role === "STAFF";
}

function hasUsableSession(user) {
  return !!user && isRecognizedRole(user.role) && hasValidUserId(user);
}

export function dashboardPathForRole(role) {
  if (role === "ADMIN") return "/admin-dashboard";
  if (role === "STAFF") return "/staff-dashboard";
  return "/user-dashboard";
}

function RootRoute() {
  const { user } = useAuth();
  if (hasUsableSession(user)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  if (hasUsableSession(user)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  if (user && !hasUsableSession(user)) {
    clearUserSession();
  }
  return children;
}

function RequireRole({ role, children }) {
  const { user } = useAuth();

  if (!hasUsableSession(user)) {
    if (user) clearUserSession();
    return <Navigate to="/login" replace />;
  }

  if (!hasRequiredRole(user, role)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return children;
}

function App() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        clearUserSession();
        if (isMounted) setIsBootstrapping(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        // If token is valid, always trust server identity for this session.
        const sessionUser = persistUserSession(response.data, token);
        if (isMounted) setCurrentUser(sessionUser);
      } catch {
        clearUserSession();
        // Fall back to whatever is already in storage
        if (isMounted) setCurrentUser(getStoredUser());
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };

    bootstrapAuth();
    return () => { isMounted = false; };
  }, []);

  if (isBootstrapping) {
    return (
      <div className="auth-wrap">
        <div className="auth-card loading-card">
          <div className="spinner" />
          <p>Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: currentUser, setUser: setCurrentUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <RequireRole role="USER">
                <UserDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <RequireRole role="ADMIN">
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/staff-dashboard"
            element={
              <RequireRole role="STAFF">
                <StaffDashboard />
              </RequireRole>
            }
          />
          <Route path="*" element={<RootRoute />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
