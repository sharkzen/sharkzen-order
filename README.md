# SHARKZEN ORDER

**English** | [ภาษาไทย](README.th.md)

![Landing page](docs/images/01-landing.png)

SHARKZEN ORDER is a QR-code ordering system for restaurants. Customers scan the code on the table, pick their food on their own phone and send it straight to the kitchen. No app to install, no waiting for someone to come take the order.

It's also the back office: orders, kitchen screen, cashier, menu, tables, staff, sales reports. And since it's built as a SaaS, there's an admin side too where I can manage shops, plans, prices and ban accounts.

The whole UI is in Thai, since that's who it's built for.

## Why I made it

Small restaurants usually end up with a mix of paper slips, shouting to the kitchen and a notebook for the day's sales. Big POS systems are expensive and heavy for a place with ten tables. I wanted something in between: simple enough to set up in an afternoon, cheap enough for a small shop, and still covering the whole flow from "customer sits down" to "money in the drawer".

## What it does

### For customers (no login)

Scan the QR on the table and the menu opens in the browser.

- Browse by category, see featured dishes, add options (spice level, extras, notes per dish)
- Send the order to the kitchen, then follow its status live
- Order more later, it all goes on the same table bill
- Call a staff member with one tap

![Customer menu](docs/images/02-customer-menu.png)

### For the shop

| Page | What it's for |
| --- | --- |
| Dashboard | Today's sales, orders, popular dishes at a glance |
| Orders | Every order, change status, cancel with a reason |
| Kitchen | A big-screen view for the cooks, new orders come in with a sound |
| Cashier | Pay a whole table at once, cash / transfer / counter, discount, change, receipt |
| Menu | Categories, dishes, photos, options, drag to reorder, mark as out of stock |
| Tables & QR | Create tables, open/close them, print the QR codes |
| Reports | Sales by period and payment method |
| Staff | Create accounts, roles and permissions per page |
| Plan | Subscription, usage against limits, invoices |
| Settings | Opening hours, service charge, PromptPay, notification sounds |

Everything updates live over WebSocket, so a new order shows up on the kitchen screen and the orders page without refreshing.

![Dashboard](docs/images/07-dashboard.png)
![Kitchen](docs/images/04-kitchen.png)

### Staff

The owner creates a username and password for each staff member and tells them directly. Staff log in at `/staff-login` with the **shop code** (shown on the Staff page), their username and password.

Each role gets its own permissions, for example a cashier sees the cashier page but not reports, a cook only sees the kitchen. The permissions are enforced on the server for every request, hiding a menu item is not the only protection.

### Plans and billing

Every shop starts with a free trial. After that they pay monthly or yearly by card (auto-renew) or PromptPay (pay per period). Payments go through Stripe. Plans decide how many branches, tables and staff accounts a shop can have.

### Admin (for me, the system owner)

A separate area at `/admin`:

- **Overview**: users, shops, estimated monthly revenue, signups, who's about to expire
- **Users**: search, ban / unban, change plan, add or remove days
- **Shops**: suspend a single branch without touching the owner's other branches
- **Plans & prices**: create, edit, hide or delete plans. Prices, limits, perks and the trial length all live in the database, nothing is hard-coded. The landing page and the sign-up pages read them from the API
- **Settings & log**: trial days, support contacts, and a log of everything an admin did

When an account is banned, the owner, their staff and their customers can't use anything, and whoever is logged in gets a modal telling them to contact support. Unban and everything comes back, no data is lost.

The admin account is the only one with 2FA (authenticator app), and in production it is required. You can also limit `/admin` to certain IP addresses.

![Admin overview](docs/images/13-admin-overview.png)
![Banned modal](docs/images/16-banned-modal.png)

## Tech stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion
- **Backend**: Fastify 5, TypeScript, Prisma 6, Zod
- **Database**: PostgreSQL 16
- **Realtime**: Socket.IO
- **Payments**: Stripe (card and PromptPay)
- **Images**: Cloudflare R2 (converted to WebP before upload)
- **Email**: SMTP (Mailpit in development)
- **Deploy**: Docker Compose + Caddy (automatic HTTPS)

```
sharkzen-order/
├── backend/     API, database schema, tests
├── frontend/    Next.js app (customer, shop, admin)
├── ops/         Caddyfile, backup and restore scripts
├── docs/        Deploy guide, screenshots
└── docker-compose.yml        dev: Postgres + Mailpit
    docker-compose.prod.yml   production stack
```

## Run it locally

You need Node.js 24+ and Docker.

```bash
# 1. database + a fake mail server
docker compose up -d

# 2. backend
cd backend
cp .env.example .env        # fill in JWT_SECRET and STRIPE_SECRET_KEY at least
npm install
npx prisma migrate deploy
npm run prisma:seed         # plans, settings, admin account, demo menu
npm run dev                 # http://localhost:3001

# 3. frontend (new terminal)
cd frontend
cp .env.example .env        # already points to the backend on :3001
npm install
npm run dev                 # http://localhost:3000
```

Emails (OTP, password reset) land in Mailpit at http://localhost:8025.

The seed creates an admin for development only:

```
admin@sharkzen.local
Aa123456
```

Please don't use that anywhere real.

### Try it

1. Go to `/register`, make an owner account, confirm the OTP from Mailpit and pick a plan
2. Add some tables and menu items, print a table's QR code
3. Open the table, scan (or open the link) on your phone and place an order
4. Watch it appear on the Kitchen page, then pay it from the Cashier
5. Log in as the admin at `/login` and look around `/admin`

### Tests

```bash
cd backend
npm test
```

The tests run against a throw-away schema in Postgres, so they never touch your dev data.

## Deploying

On a VPS, once `.env` is filled in:

```bash
git pull && docker compose up -d --build
```

That runs the migrations and the first-time seed by itself, and running it again never overwrites data you already changed. Backups, restore, monitoring and the checklist are in [docs/DEPLOY.md](docs/DEPLOY.md) (written in Thai).

## Good to know

- Run one backend instance for now. The realtime part has no Redis adapter yet.
- No automatic error reporting (Sentry etc.) and no CI set up yet.
- There's no "delete my account / export my data" feature yet.
