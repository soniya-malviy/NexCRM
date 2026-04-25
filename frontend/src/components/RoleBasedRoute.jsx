import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function RoleBasedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their default dashboard if unauthorized
    const defaultRoute = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'sales' ? '/sales/dashboard' : '/support/tickets';
    return <Navigate to={defaultRoute} replace />;
  }

  return <Outlet />;
}
