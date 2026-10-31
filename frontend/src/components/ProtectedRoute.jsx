import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-cyan-400">
        <p className="text-xl">Verifying clearance...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/defender/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
