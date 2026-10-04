import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';
import { errorInfo } from '../api.js';
import { validate } from '../validators.js';
import Field from '../components/Field.jsx';
import { useT, LangToggle } from '../i18n.jsx';

export default function Signup() {
  const { user, signup } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = validate(form, ['name', 'email', 'address', 'password']);
    setErrors(v); setError('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try { nav(homeFor((await signup(form)).role)); }
    catch (err) { const i = errorInfo(err); setError(i.message); setErrors(i.fields); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <LangToggle floating />
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>{t('Create your account')}</h1>
        {error && <p className="alert" role="alert">{t(error)}</p>}
        <Field label={t('Full name (20-60 characters)')} value={form.name} onChange={set('name')} error={errors.name} />
        <Field label={t('Email')} type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Field as="textarea" rows="3" label={t('Address (max 400 characters)')} value={form.address} onChange={set('address')} error={errors.address} />
        <Field label={t('Password (8-16 characters, one capital, one symbol)')} type="password" value={form.password} onChange={set('password')} error={errors.password} />
        <button className="btn" disabled={busy}>{busy ? t('Creating…') : t('Sign up')}</button>
        <p className="muted center">{t('Already registered?')} <Link to="/login">{t('Log in')}</Link></p>
      </form>
    </div>
  );
}
