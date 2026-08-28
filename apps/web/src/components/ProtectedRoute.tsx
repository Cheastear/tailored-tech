import { Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../store/authApi';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMeQuery();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
