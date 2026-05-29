import { useEffect, useState } from 'react';
import AuthScreen from './components/AuthScreen.jsx';
import Dashboard from './components/Dashboard.jsx';

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
  return (
    <div
      style={{
        padding: '50px',
        fontSize: '48px',
        fontWeight: 'bold',
        color: 'red'
      }}
    >
      APP.JSX TEST
    </div>
  );
}

  return <Dashboard session={session} onLogout={handleLogout} />;
}

export default App;
