import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import MemberDashboard from './pages/MemberDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/dashboard" element={<MemberDashboard />} />
    </Routes>
  );
}

export default App;