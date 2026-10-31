import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import PublicHome from './pages/PublicHome';
import DefenderLogin from './pages/DefenderLogin';
import DefenderDashboard from './pages/DefenderDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicHome />} />
          <Route path="/portal" element={<PublicHome />} /> {/* Will become deception entry later */}
          
          {/* Defender Auth */}
          <Route path="/defender/login" element={<DefenderLogin />} />
          
          {/* Protected Defender Routes */}
          <Route path="/defender" element={
            <ProtectedRoute>
              <DefenderDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
