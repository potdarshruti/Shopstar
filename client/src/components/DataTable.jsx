import { useT } from '../i18n.jsx';

export default function DataTable({ columns, rows, sort, onSort, loading, empty = 'Nothing to show yet.', onRowClick }) {
  const t = useT();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} aria-sort={sort.by === c.key ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}>
                {c.sortable === false ? t(c.label) : (
                  <button className="sort" onClick={() => onSort(c.key)}>
                    {t(c.label)}<span>{sort.by === c.key ? (sort.order === 'asc' ? ' ▲' : ' ▼') : ' ↕'}</span>
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.map((r) => (
            <tr key={r.id} onClick={onRowClick && (() => onRowClick(r))} className={onRowClick ? 'clickable' : ''}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && !rows && <p className="muted pad">{t('Loading…')}</p>}
      {rows && !rows.length && <p className="muted pad">{t(empty)}</p>}
    </div>
  );
}

// Toggle helper for list pages
export const nextSort = (sort, key) =>
  sort.by === key ? { by: key, order: sort.order === 'asc' ? 'desc' : 'asc' } : { by: key, order: 'asc' };
