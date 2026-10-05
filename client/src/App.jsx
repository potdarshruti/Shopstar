import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserStores from './pages/UserStores.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import Analytics from './pages/Analytics.jsx';

function Guard({ roles, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="muted pad">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

function Root() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route path="/admin" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
        <Route path="/admin/analytics" element={<Guard roles={['admin']}><Analytics /></Guard>} />
        <Route path="/stores" element={<Guard roles={['user']}><UserStores /></Guard>} />
        <Route path="/owner" element={<Guard roles={['owner']}><OwnerDashboard /></Guard>} />
        <Route path="/password" element={<ChangePassword />} />
      </Route>
      <Route path="*" element={<Root />} />
    </Routes>
  );
}
