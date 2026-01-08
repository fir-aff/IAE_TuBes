import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Hapus 'BrowserRouter as Router'
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MemberDashboard from './pages/MemberDashboard';
import Hotels from './pages/Hotels';
import HotelDetail from './pages/HotelDetail';

function App() {
  return (
    // PERBAIKAN: Kita HAPUS <Router> pembungkus di sini
    // Karena sudah ada di main.jsx
    <Routes>
      {/* Halaman Pertama kali dibuka = Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Pindahkan AuthPage ke /login */}
      <Route path="/login" element={<AuthPage />} />
      
      {/* Halaman User yang sudah login */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/dashboard" element={<MemberDashboard />} />
      <Route path="/hotels" element={<Hotels />} />
      <Route path="/hotels/:id" element={<HotelDetail />} />
    </Routes>
  );
}

export default App;