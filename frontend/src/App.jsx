import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Hapus 'BrowserRouter as Router'
import AuthPage from './pages/AuthPage';
import MemberDashboard from './pages/MemberDashboard';
import Hotels from './pages/Hotels';

function App() {
  return (
    // PERBAIKAN: Kita HAPUS <Router> pembungkus di sini
    // Karena sudah ada di main.jsx
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/dashboard" element={<MemberDashboard />} />
      <Route path="/hotels" element={<Hotels />} />
    </Routes>
  );
}

export default App;