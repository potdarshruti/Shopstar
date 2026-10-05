import { useT } from '../i18n.jsx';

export function Stars({ value }) {
  const t = useT();
  if (value == null) return <span className="muted">{t('No ratings yet')}</span>;
  return <span className="stars" title={`${value} out of 5`}>{'★'.repeat(Math.round(value))}<i>{'★'.repeat(5 - Math.round(value))}</i> <b>{Number(value).toFixed(1)}</b></span>;
}

export function StarInput({ value, onPick, disabled }) {
  return (
    <span className="star-input" role="group" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={disabled} className={n <= (value || 0) ? 'on' : ''}
          onClick={() => onPick(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>★</button>
      ))}
    </span>
  );
}
