import { useNavigate } from 'react-router-dom';
import { useGetMeQuery, useLogoutMutation } from '../store/authApi';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useGetMeQuery();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name ?? user?.email}</p>
      <button onClick={handleLogout}>Sign out</button>
    </div>
  );
}
