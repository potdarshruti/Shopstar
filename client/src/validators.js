// Mirrors the server-side rules so users get instant feedback.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

export const rules = {
  name: (v) => (v.trim().length >= 20 && v.trim().length <= 60 ? '' : 'Name must be 20-60 characters'),
  storeName: (v) => (v.trim().length >= 3 && v.trim().length <= 60 ? '' : 'Store name must be 3-60 characters'),
  email: (v) => (EMAIL_RE.test(v) ? '' : 'Enter a valid email address'),
  address: (v) => (v.trim() && v.length <= 400 ? '' : 'Address is required (max 400 characters)'),
  password: (v) => (PASSWORD_RE.test(v) ? '' : 'Use 8-16 characters with one uppercase letter and one special character'),
};

export function validate(form, fields) {
  const errors = {};
  fields.forEach((f) => {
    const key = f === 'storeName' ? 'name' : f; // storeName is validated against form.name
    const m = rules[f](form[key] || '');
    if (m) errors[key] = m;
  });
  return errors;
}
