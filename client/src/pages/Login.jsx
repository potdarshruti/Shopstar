import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';
import { errorInfo } from '../api.js';
import Field from '../components/Field.jsx';
import { useT, LangToggle } from '../i18n.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { nav(homeFor((await login(form.email, form.password)).role)); }
    catch (err) { setError(errorInfo(err).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <LangToggle floating />
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>{t('Log in')}</h1>
        <p className="muted">{t('Members, store owners and administrators all sign in here.')}</p>
        {error && <p className="alert" role="alert">{t(error)}</p>}
        <Field label={t('Email')} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label={t('Password')} type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn" disabled={busy}>{busy ? t('Logging in…') : t('Log in')}</button>
        <p className="muted center">{t('New here?')} <Link to="/signup">{t('Create an account')}</Link></p>
      </form>
    </div>
  );
}
