import { useState } from 'react';
import api, { errorInfo, useFetch } from '../api.js';
import { validate } from '../validators.js';
import DataTable, { nextSort } from '../components/DataTable.jsx';
import Field from '../components/Field.jsx';
import { Stars } from '../components/Stars.jsx';
import { useT } from '../i18n.jsx';

const ROLES = { admin: 'Admin', user: 'Normal user', owner: 'Store owner' };

function Stats() {
  const t = useT();
  const { data } = useFetch('/admin/stats');
  const items = [['users', 'Total users'], ['stores', 'Total stores'], ['ratings', 'Ratings submitted']];
  return (
    <div className="stats">
      {items.map(([k, label]) => <div className="stat" key={k}><b>{data ? data[k] : '–'}</b><span>{t(label)}</span></div>)}
    </div>
  );
}

function AddForm({ title, fields, initial, validateFields, endpoint, extra, onDone }) {
  const t = useT();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = validate(form, validateFields);
    setErrors(v); setMsg({ type: '', text: '' });
    if (Object.keys(v).length) return;
    try {
      await api.post(endpoint, form);
      setForm(initial);
      setMsg({ type: 'ok', text: 'Saved.' });
      onDone();
    } catch (err) { const i = errorInfo(err); setErrors(i.fields); setMsg({ type: 'bad', text: i.message }); }
  };

  return (
    <form className="card add-form" onSubmit={submit} noValidate>
      <h3>{t(title)}</h3>
      {msg.text && <p className={msg.type === 'ok' ? 'notice' : 'alert'} role="status">{t(msg.text)}</p>}
      {fields.map(([k, label, type]) => (
        <Field key={k} label={t(label)} type={type || 'text'} as={k === 'address' ? 'textarea' : 'input'} rows={k === 'address' ? 2 : undefined}
          value={form[k]} onChange={set(k)} error={errors[k]} />
      ))}
      {extra && extra(form, set, errors)}
      <button className="btn">{t(title)}</button>
    </form>
  );
}

function UsersTab() {
  const t = useT();
  const [q, setQ] = useState({ name: '', email: '', address: '', role: '' });
  const [sort, setSort] = useState({ by: 'name', order: 'asc' });
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const { data, loading, error, reload } = useFetch('/admin/users', { ...q, sortBy: sort.by, order: sort.order });
  const detail = useFetch(selected ? `/admin/users/${selected}` : '/admin/stats');

  const columns = [
    { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Address' },
    { key: 'role', label: 'Role', render: (u) => t(ROLES[u.role]) },
  ];
  const f = (k, ph) => <input placeholder={t(ph)} aria-label={t(ph)} value={q[k]} onChange={(e) => setQ({ ...q, [k]: e.target.value })} />;

  return (
    <>
      <div className="toolbar">
        <div className="filters">
          {f('name', 'Filter by name')}{f('email', 'Filter by email')}{f('address', 'Filter by address')}
          <select value={q.role} onChange={(e) => setQ({ ...q, role: e.target.value })} aria-label={t('Filter by role')}>
            <option value="">{t('All roles')}</option>
            {Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
          </select>
        </div>
        <button className="btn" onClick={() => setAdding(!adding)}>{adding ? t('Close form') : t('Add user')}</button>
      </div>
      {adding && (
        <AddForm title="Add user" endpoint="/admin/users" validateFields={['name', 'email', 'address', 'password']}
          initial={{ name: '', email: '', address: '', password: '', role: 'user' }}
          fields={[['name', 'Name (20-60 characters)'], ['email', 'Email', 'email'], ['address', 'Address'], ['password', 'Password', 'password']]}
          extra={(form, set, errors) => (
            <Field as="select" label={t('Role')} value={form.role} onChange={set('role')} error={errors.role}>
              {Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
            </Field>)}
          onDone={reload} />
      )}
      {error && <p className="alert">{error}</p>}
      <DataTable columns={columns} rows={data} loading={loading} sort={sort} onSort={(k) => setSort(nextSort(sort, k))}
        onRowClick={(u) => setSelected(u.id)} empty="No users match these filters." />
      {selected && detail.data?.email && (
        <aside className="card detail">
          <button className="btn ghost" onClick={() => setSelected(null)}>{t('Close')}</button>
          <h3>{detail.data.name}</h3>
          <dl>
            <dt>{t('Email')}</dt><dd>{detail.data.email}</dd>
            <dt>{t('Address')}</dt><dd>{detail.data.address}</dd>
            <dt>{t('Role')}</dt><dd>{t(ROLES[detail.data.role])}</dd>
            {detail.data.role === 'owner' && <><dt>{t('Store rating')}</dt><dd><Stars value={detail.data.rating} /></dd></>}
          </dl>
        </aside>
      )}
    </>
  );
}

function StoresTab() {
  const t = useT();
  const [q, setQ] = useState({ name: '', email: '', address: '' });
  const [sort, setSort] = useState({ by: 'name', order: 'asc' });
  const [adding, setAdding] = useState(false);
  const { data, loading, error, reload } = useFetch('/admin/stores', { ...q, sortBy: sort.by, order: sort.order });
  const owners = useFetch('/admin/available-owners');

  const columns = [
    { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Address' },
    { key: 'rating', label: 'Rating', render: (s) => <Stars value={s.rating} /> },
    { key: 'score', label: 'Score', render: (s) => Number(s.score).toFixed(2) },
  ];
  const f = (k, ph) => <input placeholder={t(ph)} aria-label={t(ph)} value={q[k]} onChange={(e) => setQ({ ...q, [k]: e.target.value })} />;

  return (
    <>
      <div className="toolbar">
        <div className="filters">{f('name', 'Filter by name')}{f('email', 'Filter by email')}{f('address', 'Filter by address')}</div>
        <button className="btn" onClick={() => setAdding(!adding)}>{adding ? t('Close form') : t('Add store')}</button>
      </div>
      {adding && (
        <AddForm title="Add store" endpoint="/admin/stores" validateFields={['name', 'email', 'address']}
          initial={{ name: '', email: '', address: '', ownerId: '' }}
          fields={[['name', 'Store name (20-60 characters)'], ['email', 'Store email', 'email'], ['address', 'Address']]}
          extra={(form, set, errors) => (
            <Field as="select" label={t('Store owner (optional)')} value={form.ownerId} onChange={set('ownerId')} error={errors.ownerId}>
              <option value="">{t('No owner assigned')}</option>
              {owners.data?.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}
            </Field>)}
          onDone={() => { reload(); owners.reload(); }} />
      )}
      {error && <p className="alert">{error}</p>}
      <DataTable columns={columns} rows={data} loading={loading} sort={sort} onSort={(k) => setSort(nextSort(sort, k))}
        empty="No stores match these filters." />
    </>
  );
}

export default function AdminDashboard() {
  const t = useT();
  const [tab, setTab] = useState('users');
  return (
    <section>
      <h2>{t('Dashboard')}</h2>
      <Stats />
      <div className="tabs" role="tablist">
        {[['users', 'Users'], ['stores', 'Stores']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t(l)}</button>
        ))}
      </div>
      {tab === 'users' ? <UsersTab /> : <StoresTab />}
    </section>
  );
}
