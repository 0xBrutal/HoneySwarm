import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import PublicHome from './pages/PublicHome';
import DefenderLogin from './pages/DefenderLogin';
import DefenderDashboard from './pages/DefenderDashboard';
import EmployeePortal from './pages/EmployeePortal';
import Workspace from './pages/Workspace';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public corporate site */}
          <Route path="/" element={<PublicHome />} />

          {/* Deception environment (identical corporate language) */}
          <Route path="/portal" element={<EmployeePortal />} />
          <Route path="/portal/workspace" element={<Workspace />} />

          {/* Defender authentication */}
          <Route path="/defender/login" element={<DefenderLogin />} />

          {/* Protected defender workspace */}
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
