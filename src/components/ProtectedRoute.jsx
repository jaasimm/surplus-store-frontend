import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/Feedback';

/**
 * Route guard.
 * `adminOnly` additionally requires role === 'admin'.
 * Unauthenticated visitors see the OTP modal and stay on the page they wanted.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, booting, isAuthenticated, isAdmin, requireLogin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!booting && !isAuthenticated) {
      requireLogin(
        adminOnly
          ? 'Admin login required to open the panel'
          : 'Login to continue — track orders, save addresses and check out'
      );
    }
    if (!booting && isAuthenticated && adminOnly && !isAdmin) {
      requireLogin('This account does not have admin access');
    }
  }, [booting, isAuthenticated, isAdmin, adminOnly, requireLogin]);

  if (booting) return <PageLoader label="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace state={{ from: location.pathname }} />;

  return children;
}
