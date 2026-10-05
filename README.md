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
- All SQL is parameterised; `ORDER BY` columns come from a whitel# DukanStar ⭐

**Rate local stores, discover the best ones.** A full-stack web app where customers rate stores from 1 to 5, store owners track their feedback, and administrators manage the whole platform. Available in **English and Marathi (मराठी)**.

> *Dukan* (दुकान) means "shop" in Marathi.

## Features

**Everyone**
- One login for all roles, with access based on role
- English / Marathi language toggle (remembered in the browser)
- Change password after login

**Normal user**
- Sign up and log in
- Browse all stores and search by name or address
- Submit a rating (1-5) and change it later
- See each store's overall rating, your own rating, and a weighted **ranking score**
- Sort by any column, or use "Top ranked first"

**Store owner**
- Dashboard with the store's average rating and number of ratings
- List of users who rated the store (sortable)

**System administrator**
- Dashboard with total users, stores and ratings
- Add users (admin, normal user, store owner) and stores
- Filter and sort users and stores by name, email, address and role
- View user details (owners also show their store rating)
- **Analytics page:** ratings per day, top-rated stores, most active users, 1-5 star breakdown

## Weighted ranking score

A plain average is unfair: one 5-star rating should not beat 200 ratings averaging 4.7. Stores are ranked with a Bayesian average:

```
score = v / (v + m) × R  +  m / (v + m) × C
```

| Symbol | Meaning |
|---|---|
| v | Number of ratings the store has |
| R | The store's average rating |
| C | Average of all ratings on the platform |
| m | Ratings needed before a store's own average counts for most (`RANKING_MIN_VOTES`, default 5) |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | MySQL |
| Auth | JWT, bcrypt password hashing |

## Project structure

```
├── server/
│   ├── schema.sql          # database tables
│   └── src/
│       ├── index.js, app.js, db.js
│       ├── middleware.js   # auth, roles, safe sorting, error handler
│       ├── validate.js     # form validation rules
│       ├── ranking.js      # weighted score SQL
│       ├── seed.js         # creates the first admin
│       └── routes/         # auth, admin, stores, owner
└── client/
    └── src/
        ├── pages/          # Login, Signup, AdminDashboard, Analytics, UserStores, OwnerDashboard, ChangePassword
        ├── components/     # Layout, DataTable, Field, Stars
        ├── i18n.jsx, mr.js # language switch and Marathi text
        └── api.js, auth.jsx, validators.js
```

## Getting started

**Requirements:** Node.js 18+ and MySQL 8+

**1. Create the database**
```bash
mysql -u root -p < server/schema.sql
```

**2. Start the server**
```bash
cd server
cp .env.example .env      # then edit the values below
npm install
npm run seed              # creates the first administrator
npm run dev               # http://localhost:5000
```

**3. Start the client**
```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

### Environment variables (`server/.env`)

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | API port | 5000 |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection | localhost, root, (empty), store_ratings |
| `JWT_SECRET` | Secret for signing tokens (**required**, use a long random string) | none |
| `CLIENT_ORIGIN` | Allowed frontend URL (CORS) | http://localhost:5173 |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin created by `npm run seed` | admin@storerating.com, Admin@12345 |
| `RANKING_MIN_VOTES` | The `m` value in the ranking formula | 5 |

Change the default admin password after your first login.

## How to try it

1. Log in as the admin and create a user with the **Store owner** role.
2. Add a store and assign that owner.
3. Sign up as a normal user at `/signup`, find the store and rate it.
4. Log in as the owner to see the rating, then as the admin to see it on the Analytics page.

## Form validation

Rules are checked in the browser and again on the server.

| Field | Rule |
|---|---|
| Name | 20-60 characters |
| Address | Up to 400 characters |
| Password | 8-16 characters, at least one uppercase letter and one special character |
| Email | Standard email format |
| Rating | Whole number from 1 to 5 |

## Database design

- `users` (id, name, email, password_hash, address, role)
- `stores` (id, name, email, address, owner_id)
- `ratings` (id, user_id, store_id, rating, created_at, updated_at)

`ratings` has a unique key on (user_id, store_id) and a check that the rating is between 1 and 5, so each user has one editable rating per store. Each owner can own one store. Foreign keys cascade deletes.

## API overview

| Method | Path | Role |
|---|---|---|
| POST | `/api/auth/signup`, `/api/auth/login` | Public |
| GET | `/api/auth/me` | Any |
| PUT | `/api/auth/password` | Any |
| GET | `/api/admin/stats` | Admin |
| GET, POST | `/api/admin/users` | Admin |
| GET | `/api/admin/users/:id` | Admin |
| GET, POST | `/api/admin/stores` | Admin |
| GET | `/api/admin/available-owners` | Admin |
| GET | `/api/admin/analytics?days=14` | Admin |
| GET | `/api/stores?name=&address=&sortBy=&order=` | User |
| PUT | `/api/stores/:id/rating` | User |
| GET | `/api/owner/dashboard` | Owner |

List endpoints accept `sortBy` and `order=asc|desc`. Admin lists also accept `name`, `email`, `address` filters, and `role` for users.

## Security

- Passwords hashed with bcrypt, sessions use signed JWTs
- Role checks on every protected route
- All SQL queries are parameterised, and sortable columns come from a whitelist
- Request body size limited, CORS restricted to the frontend origin

## Screenshots

_Add screenshots here: login page, store list, owner dashboard, admin analytics, Marathi view._

## Possible future improvements

- Written reviews and owner replies
- Store categories and a nearby-stores view using location
- Email verification and password reset

## Author

Built by [@potdarshruti](https://github.com/potdarshruti).
ist.
- `ratings` has `UNIQUE(user_id, store_id)` and a `CHECK (rating BETWEEN 1 AND 5)`, so one editable rating per user per store is enforced by the database.
- Validation rules (name 20-60, address ≤ 400, password 8-16 with a capital and a symbol, valid email) run on both client and server.
- Each store owner can own one store (`stores.owner_id` is unique).
