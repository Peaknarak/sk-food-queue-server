// src/App.tsx
import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import StudentDashboard from './components/StudentDashboard';
import VendorDashboard from './components/VendorDashboard';
import { User } from './lib/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  function logout(){ setUser(null); }
  if (!user) return <LoginScreen onLoggedIn={setUser} />;
  return user.type==='student'
    ? <StudentDashboard user={user} onLogout={logout} />
    : <VendorDashboard user={user} onLogout={logout} />;
}
