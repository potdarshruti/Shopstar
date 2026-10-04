import { useState } from 'react';
import api, { errorInfo, useFetch } from '../api.js';
import DataTable, { nextSort } from '../components/DataTable.jsx';
import { Stars, StarInput } from '../components/Stars.jsx';
import { useT } from '../i18n.jsx';

export default function UserStores() {
  const t = useT();
  const [q, setQ] = useState({ name: '', address: '' });
  const [sort, setSort] = useState({ by: 'name', order: 'asc' });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(null);
  const { data, loading, error, reload } = useFetch('/stores', { ...q, sortBy: sort.by, order: sort.order });

  const rate = async (store, rating) => {
    setSaving(store.id); setMsg('');
    try { await api.put(`/stores/${store.id}/rating`, { rating }); reload(); }
    catch (e) { setMsg(errorInfo(e).message); }
    finally { setSaving(null); }
  };

  const columns = [
    { key: 'name', label: 'Store' },
    { key: 'address', label: 'Address' },
    { key: 'rating', label: 'Overall rating', render: (s) => (
      <span className="rate-cell"><Stars value={s.rating} />{s.ratingCount > 0 && <small className="muted">{s.ratingCount} {t('ratings')}</small>}</span>) },
    { key: 'score', label: 'Ranking score', render: (s) => <b>{Number(s.score).toFixed(2)}</b> },
    { key: 'myRating', label: 'Your rating', render: (s) => (
      <span className="rate-cell">
        <StarInput value={s.myRating} disabled={saving === s.id} onPick={(n) => rate(s, n)} />
        <small className="muted">{s.myRating ? t('Click a star to change') : t('Not rated yet')}</small>
      </span>) },
  ];

  return (
    <section>
      <h2>{t('Stores')}</h2>
      <div className="filters">
        <input placeholder={t('Search by store name')} value={q.name} onChange={(e) => setQ({ ...q, name: e.target.value })} aria-label={t('Search by store name')} />
        <input placeholder={t('Search by address')} value={q.address} onChange={(e) => setQ({ ...q, address: e.target.value })} aria-label={t('Search by address')} />
        <button className="btn ghost dark" onClick={() => setSort({ by: 'score', order: 'desc' })}>{t('Top ranked first')}</button>
      </div>
      <p className="muted hint">{t("Ranking score balances a store's average rating with how many people rated it.")}</p>
      {(error || msg) && <p className="alert" role="alert">{t(error || msg)}</p>}
      <DataTable columns={columns} rows={data} loading={loading} sort={sort} onSort={(k) => setSort(nextSort(sort, k))}
        empty="No stores match your search." />
    </section>
  );
}
