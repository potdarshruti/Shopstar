import { useState } from 'react';
import { useFetch } from '../api.js';
import DataTable, { nextSort } from '../components/DataTable.jsx';
import { Stars } from '../components/Stars.jsx';
import { useT, useLang } from '../i18n.jsx';

export default function OwnerDashboard() {
  const t = useT();
  const { lang } = useLang();
  const [sort, setSort] = useState({ by: 'date', order: 'desc' });
  const { data, loading, error } = useFetch('/owner/dashboard', { sortBy: sort.by, order: sort.order });

  if (error) return <p className="alert">{t(error)}</p>;
  if (!data) return <p className="muted pad">{t('Loading…')}</p>;
  if (!data.store) return <p className="notice">{t('No store is linked to your account yet. Ask an administrator to assign one.')}</p>;

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'rating', label: 'Rating', render: (r) => <Stars value={r.rating} /> },
    { key: 'date', label: 'Rated on', render: (r) => new Date(r.date).toLocaleDateString(lang === 'mr' ? 'mr-IN' : undefined) },
  ];

  return (
    <section>
      <h2>{data.store.name}</h2>
      <p className="muted">{data.store.address}</p>
      <div className="stats">
        <div className="stat"><b>{data.store.averageRating ?? '–'}</b><span>{t('Average rating')}</span></div>
        <div className="stat"><b>{data.store.ratingCount}</b><span>{t('Ratings received')}</span></div>
      </div>
      <h3>{t('Customers who rated your store')}</h3>
      <DataTable columns={columns} rows={data.raters} loading={loading} sort={sort} onSort={(k) => setSort(nextSort(sort, k))}
        empty="No one has rated your store yet." />
    </section>
  );
}
