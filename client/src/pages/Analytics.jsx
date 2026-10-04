import { useState } from 'react';
import { useFetch } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import { Stars } from '../components/Stars.jsx';
import { useT, useLang } from '../i18n.jsx';

function DayChart({ data, locale }) {
  const W = 640, H = 220, pad = { l: 32, r: 8, t: 12, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.count));
  const bw = (W - pad.l - pad.r) / data.length;
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const step = Math.ceil(data.length / 7);
  const fmt = (s) => new Date(`${s}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Ratings per day">
      {[0, max].map((v) => (
        <g key={v}><line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#dde2e5" /><text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#667682">{v}</text></g>
      ))}
      {data.map((d, i) => (
        <g key={d.day}>
          <rect x={pad.l + i * bw + 2} y={y(d.count)} width={Math.max(bw - 4, 2)} height={H - pad.b - y(d.count)} rx="2" fill="#0f6b6a"><title>{`${fmt(d.day)}: ${d.count}`}</title></rect>
          {i % step === 0 && <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#667682">{fmt(d.day)}</text>}
        </g>
      ))}
    </svg>
  );
}

export default function Analytics() {
  const t = useT();
  const { lang } = useLang();
  const [days, setDays] = useState(14);
  const { data, error } = useFetch('/admin/analytics', { days });
  if (error) return <p className="alert">{t(error)}</p>;
  if (!data) return <p className="muted pad">{t('Loading…')}</p>;

  const total = data.distribution.reduce((a, d) => a + d.count, 0);
  const storeCols = [
    { key: 'name', label: 'Store', sortable: false },
    { key: 'rating', label: 'Average rating', sortable: false, render: (s) => <Stars value={s.rating} /> },
    { key: 'ratingCount', label: 'Ratings', sortable: false },
    { key: 'score', label: 'Score', sortable: false, render: (s) => <b>{Number(s.score).toFixed(2)}</b> },
  ];
  const userCols = [
    { key: 'name', label: 'Name', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'ratingCount', label: 'Ratings given', sortable: false },
    { key: 'avgGiven', label: 'Average given', sortable: false },
  ];

  return (
    <section>
      <div className="toolbar">
        <h2>{t('Analytics')}</h2>
        <label className="inline">{t('Period')}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 14, 30].map((n) => <option key={n} value={n}>{t(`${n} days`)}</option>)}
          </select>
        </label>
      </div>

      <h3>{t('Ratings per day')}</h3>
      <div className="card"><DayChart data={data.perDay} locale={lang === 'mr' ? 'mr-IN' : undefined} /></div>

      <h3>{t('Top-rated stores')}</h3>
      <p className="muted hint">{t("Ranking score balances a store's average rating with how many people rated it.")}</p>
      <DataTable columns={storeCols} rows={data.topStores} sort={{}} onSort={() => {}} empty="No ratings have been submitted yet." />

      <h3>{t('Most active users')}</h3>
      <DataTable columns={userCols} rows={data.activeUsers} sort={{}} onSort={() => {}} empty="No activity yet." />

      <h3>{t('Rating breakdown')}</h3>
      <div className="card dist">
        {[5, 4, 3, 2, 1].map((n) => {
          const c = data.distribution.find((d) => d.rating === n).count;
          return (
            <div className="dist-row" key={n}>
              <span>{n} ★</span>
              <div className="bar"><i style={{ width: total ? `${(c / total) * 100}%` : 0 }} /></div>
              <span>{c}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
