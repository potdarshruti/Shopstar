# Store Ratings Platform

Express + MySQL API with a React (Vite) front end. One login for three roles: System Administrator, Normal User, Store Owner.

## Setup

**1. Database**
```bash
mysql -u root -p < server/schema.sql
```

**2. Server**
```bash
cd server
cp .env.example .env     # set DB credentials and a long random JWT_SECRET
npm install
npm run seed             # creates the first admin (see ADMIN_EMAIL / ADMIN_PASSWORD in .env)
npm run dev              # http://localhost:5000
```

**3. Client**
```bash
cd client
npm install
npm run dev              # http://localhost:5173 (proxies /api to the server)
```

Default admin: `admin@storerating.com` / `Admin@12345` (change after first login).

## Typical flow
1. Log in as admin, add a user with the **Store owner** role, then add a store and assign that owner.
2. Sign up as a normal user at `/signup`, browse stores, and rate them from 1 to 5. Click a different star to change a rating.
3. Log in as the owner to see the store's average rating and who rated it.

## API summary
| Method | Path | Role |
|---|---|---|
| POST | /api/auth/signup, /api/auth/login | public |
| GET | /api/auth/me | any |
| PUT | /api/auth/password | any |
| GET | /api/admin/stats | admin |
| GET/POST | /api/admin/users, GET /api/admin/users/:id | admin |
| GET/POST | /api/admin/stores, GET /api/admin/available-owners | admin |
| GET | /api/stores?name=&address=&sortBy=&order= | user |
| PUT | /api/stores/:id/rating `{ rating: 1-5 }` | user |
| GET | /api/owner/dashboard | owner |
| GET | /api/admin/analytics?days=14 | admin |

List endpoints accept `sortBy` and `order=asc|desc`; admin lists also accept `name`, `email`, `address` (and `role` for users) filters.

## Added features
- **Marathi / English toggle** (top bar, and top-right on login and signup). Choice is remembered in the browser. Translations live in `client/src/mr.js`; add a line there to translate any new UI text.
- **Weighted ranking score** for stores: `score = v/(v+m) * R + m/(v+m) * C` (v = ratings for the store, R = its average, C = platform-wide average, m = `RANKING_MIN_VOTES`, default 5). Shown in the user store list (sortable, plus a "Top ranked first" button) and in the admin store list.
- **Admin analytics** (`/admin/analytics`): ratings per day (7/14/30 days), top-rated stores by weighted score, most active users, and a 1-5 star breakdown. API: `GET /api/admin/analytics?days=14`.

## Design notes
- Passwords hashed with bcrypt; JWT auth; role checks in middleware on every route.
- All SQL is parameterised; `ORDER BY` columns come from a whitelist.
- `ratings` has `UNIQUE(user_id, store_id)` and a `CHECK (rating BETWEEN 1 AND 5)`, so one editable rating per user per store is enforced by the database.
- Validation rules (name 20-60, address ≤ 400, password 8-16 with a capital and a symbol, valid email) run on both client and server.
- Each store owner can own one store (`stores.owner_id` is unique).
