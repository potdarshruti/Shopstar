import { useT } from '../i18n.jsx';

export default function Field({ label, error, as = 'input', children, ...props }) {
  const Tag = as;
  const t = useT();
  return (
    <label className="field">
      <span>{label}</span>
      <Tag {...props} aria-invalid={!!error}>{children}</Tag>
      {error && <small className="error">{t(error)}</small>}
    </label>
  );
}
