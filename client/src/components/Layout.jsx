import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useT, LangToggle } from '../i18n.jsx';

const ROLE_LABEL = { admin: 'Administrator', user: 'Member', owner: 'Store owner' };

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const home = { admin: '/admin', owner: '/owner', user: '/stores' }[user.role];
  return (
    <>
      <header className="topbar">
        <strong className="brand">{t('ShopStar ⭐')}</strong>
        <nav>
          <NavLink to={home} end>{user.role === 'user' ? t('Stores') : t('Dashboard')}</NavLink>
          {user.role === 'admin' && <NavLink to="/admin/analytics">{t('Analytics')}</NavLink>}
          <NavLink to="/password">{t('Change password')}</NavLink>
        </nav>
        <LangToggle />
        <div className="who"><span>{user.name}<small>{t(ROLE_LABEL[user.role])}</small></span>
          <button className="btn ghost" onClick={() => { logout(); nav('/login'); }}>{t('Log out')}</button>
        </div>
      </header>
      <main className="page"><Outlet /></main>
    </>
  );
}
