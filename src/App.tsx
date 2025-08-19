// src/App.tsx
import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import StudentDashboard from './components/StudentDashboard';
import VendorDashboard from './components/VendorDashboard';
import AdminDashboard from './components/AdminDashboard';
import { User } from './lib/api';

export default function App(){
  const [user, setUser] = useState<User | null>(null);
  function logout(){ setUser(null); }

  if (!user) return <LoginScreen onLoggedIn={setUser} />;

  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={logout} />;
  }
  if (user.role === 'vendor') {
    return <VendorDashboard user={user} onLogout={logout} />;
  }
  return <StudentDashboard user={user} onLogout={logout} />;
}
