const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

const checks = {
  name: (v) => (typeof v === 'string' && v.trim().length >= 20 && v.trim().length <= 60) || 'Name must be 20-60 characters',
  // Store names are real shop names, so they may be shorter than a person's full name
  storeName: (v) => (typeof v === 'string' && v.trim().length >= 3 && v.trim().length <= 60) || 'Store name must be 3-60 characters',
  email: (v) => (typeof v === 'string' && v.length <= 255 && EMAIL_RE.test(v)) || 'Enter a valid email address',
  address: (v) => (typeof v === 'string' && v.trim().length > 0 && v.length <= 400) || 'Address is required (max 400 characters)',
  password: (v) => (typeof v === 'string' && PASSWORD_RE.test(v)) || 'Password must be 8-16 characters with one uppercase letter and one special character',
};

/** Returns an object of { field: message } or null when everything is valid. */
function validate(body, fields) {
  const errors = {};
  for (const f of fields) {
    const key = f === 'storeName' ? 'name' : f; // storeName is validated against body.name
    const r = checks[f](body[key]);
    if (r !== true) errors[key] = r;
  }
  return Object.keys(errors).length ? errors : null;
}

module.exports = { validate, PASSWORD_RE, EMAIL_RE };
