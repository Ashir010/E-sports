import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PageFallback from '../components/ui/PageFallback.jsx';
import Button from '../components/ui/Button.jsx';

/** Requires a signed-in user; otherwise redirects to /login?redirect=… */
export function ProtectedRoute() {
  const { userId, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageFallback />;
  if (!userId) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!profile) return <PageFallback />;
  return <Outlet />;
}

/**
 * UI gate for admin pages. This is a convenience only — the real protection is
 * enforced by Supabase RLS policies and SECURITY DEFINER functions that check is_admin().
 */
export function AdminRoute() {
  const { userId, isAdmin, loading, profile } = useAuth();
  const location = useLocation();
  if (loading || (userId && !profile)) return <PageFallback />;
  if (!userId) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin)
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-danger" aria-hidden />
          <h1 className="mt-4 text-3xl font-bold uppercase">Access denied</h1>
          <p className="mt-2 text-mist-400">This area is for tournament administrators only.</p>
          <Button to="/" variant="secondary" className="mt-6">
            Back to home
          </Button>
        </div>
      </div>
    );
  return <Outlet />;
}
