import { useState } from 'react';
import api, { errorInfo } from '../api.js';
import { validate } from '../validators.js';
import Field from '../components/Field.jsx';
import { useT } from '../i18n.jsx';

export default function ChangePassword() {
  const t = useT();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = validate({ password: form.newPassword }, ['password']);
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = 'Enter your current password';
    if (v.password) errs.newPassword = v.password;
    setErrors(errs); setMsg({ type: '', text: '' });
    if (Object.keys(errs).length) return;
    try {
      await api.put('/auth/password', form);
      setForm({ currentPassword: '', newPassword: '' });
      setMsg({ type: 'ok', text: 'Password updated.' });
    } catch (err) { const i = errorInfo(err); setErrors(i.fields); setMsg({ type: 'bad', text: i.message }); }
  };

  return (
    <form className="card narrow" onSubmit={submit} noValidate>
      <h2>{t('Change password')}</h2>
      {msg.text && <p className={msg.type === 'ok' ? 'notice' : 'alert'} role="status">{t(msg.text)}</p>}
      <Field label={t('Current password')} type="password" value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} />
      <Field label={t('New password')} type="password" value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} />
      <button className="btn">{t('Update password')}</button>
    </form>
  );
}
