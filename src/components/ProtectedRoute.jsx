import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/Feedback';

/**
 * Route guard.
 * `adminOnly` additionally requires role === 'admin'.
 * Unauthenticated visitors see the OTP modal and are returned to the page
 * they asked for once the login succeeds (instead of being dumped on home
 * and having to navigate again).
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { booting, isAuthenticated, isAdmin, requireLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (booting) return;
    if (!isAuthenticated) {
      requireLogin(
        adminOnly
          ? 'Admin login required to open the panel'
          : 'Login to continue — track orders, save addresses and check out',
        () => navigate(from, { replace: true })
      );
      return;
    }
    if (adminOnly && !isAdmin) {
      requireLogin('This account does not have admin access', () => navigate('/', { replace: true }));
    }
  }, [booting, isAuthenticated, isAdmin, adminOnly, requireLogin, navigate, from]);

  if (booting) return <PageLoader label="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace state={{ from }} />;

  return children;
}
