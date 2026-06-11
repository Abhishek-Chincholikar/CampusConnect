import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import AdminUsers from './pages/AdminUsers.jsx';
import AdminAnnouncements from './pages/AdminAnnouncements.jsx';
import AdminReports from './pages/AdminReports.jsx';
import AdminOrganizations from './pages/AdminOrganizations.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
// --- CLASSIFICATION IMPORT FIX ---
import FacultyDashboard from './components/FacultyDashboard.jsx';

const SESSION_KEY = 'campusconnect_session';
const TOKEN_KEY = 'campusconnect_token';

const readStoredSession = () => {
  try {
    const storedSession = window.localStorage.getItem(SESSION_KEY);
    const token = window.localStorage.getItem(TOKEN_KEY);

    if (!storedSession || !token) {
      return null;
    }

    const parsedSession = JSON.parse(storedSession);
    return {
      ...parsedSession,
      token,
    };
  } catch {
    return null;
  }
};

function App() {
  const [session, setSession] = useState(() => readStoredSession());

  useEffect(() => {
    if (!session?.token) {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(TOKEN_KEY);
      return;
    }

    window.localStorage.setItem(TOKEN_KEY, session.token);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user: session.user }));
  }, [session]);

  const handleAuthenticated = (payload) => {
    setSession(payload);
  };

  const handleLogout = () => {
    setSession(null);
  };

  if (!session?.token) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  // CHANNEL 1: SYSTEM ADMINISTRATOR CONTROL TIER (FIXED PROPS)
  if (session.user.role === 'Admin') {
    return (
      <Routes>
        <Route
          path="/"
          element={
            <AdminDashboard
              session={session}
              onLogout={handleLogout}
            />
          }
        />
        {/* --- FIXED: Added session prop down to Admin routing slots --- */}
        <Route
          path="/admin/users"
          element={<AdminUsers session={session} />}
        />
        <Route
          path="/admin/announcements"
          element={<AdminAnnouncements session={session} />}
        />
        <Route
          path="/admin/reports"
          element={<AdminReports session={session} />}
        />
        <Route
          path="/admin/organizations"
          element={<AdminOrganizations session={session} />}
        />
      </Routes>
    );
  }

  // ---- CHANNEL 2: FIXED FACULTY COORDINATOR ROUTING MATRIX ----
  if (session.user.role === 'Faculty') {
    return (
      <Routes>
        {/* Base Dashboard Path */}
        <Route
          path="/"
          element={
            <FacultyDashboard
              session={session}
              onLogout={handleLogout}
            />
          }
        />
        {/* --- FIXED: session prop is now explicitly sent downward to both views --- */}
        <Route
          path="/admin/users"
          element={<AdminUsers session={session} />}
        />
        <Route
          path="/admin/announcements"
          element={<AdminAnnouncements />}
        />
        <Route
          path="/admin/reports"
          element={<AdminReports />}
        />
        <Route
          path="/admin/organizations"
          element={<AdminOrganizations session={session} />}
        />
      </Routes>
    );
  }

  // CHANNEL 3: GENERAL FALLBACK FOR STUDENTS AND REGISTERED SYSTEM HEADS
  return (
    <Dashboard
      session={session}
      onLogout={handleLogout}
    />
  );
}

export default App;