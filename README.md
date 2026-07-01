# My Expense Tracker — UK Family Budget App

A full-stack UK family expense tracker built with React, Express, Prisma, and MySQL.
Multiple family members can share one household's expense data.

---

## Project Structure

```
├── backend/          Express REST API + Prisma ORM
│   ├── src/
│   │   ├── routes/   Auth, categories, transactions, summaries, export
│   │   └── middleware/
│   ├── prisma/       Schema and migrations
│   └── scripts/      Seed & data-clear scripts (see WARNING below)
├── frontend/         React (Vite) + Tailwind CSS + Recharts
│   └── src/
│       ├── pages/    Login, Register, Dashboard, Transactions, etc.
│       ├── components/
│       ├── context/  Auth context (JWT)
│       └── utils/    Currency formatting
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+ (or Docker)
- npm

### 1. Environment Variables

Copy or edit `backend/.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/expense_tracker"
JWT_SECRET="change-this-to-a-long-random-string"
PORT=5000
```

### 2. Install & Setup

```bash
# Backend
cd backend
npm install
npx prisma db push    # Creates tables (or use prisma migrate dev)
npm run dev            # Starts on :5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev            # Starts on :3000, proxies /api to :5000
```

### 3. Open the App

Visit **http://localhost:3000** — register a new account and start tracking.

---

## Database Scripts — READ CAREFULLY

Two scripts are provided. They do **very different things**:

### `npm run seed` (run manually, fresh DB only)

Creates a demo household, one user (`demo@example.com` / `password123`), the 22 default categories, and several weeks of sample transactions.

**Only run against an empty database.** Will fail with duplicate-email error if a user already exists.

```bash
cd backend
npm run seed
```

### `npm run clear-transactions` (safe to run anytime)

**Deletes rows ONLY from the Transaction table.** Never touches Category, User, or Household tables. Use this to wipe dummy transactions without losing your categories or accounts.

```bash
cd backend
npm run clear-transactions
```

```
┌────────────────────────────────────────────────────────┐
│  NEVER confuse these scripts.                          │
│  seed              = creates everything from scratch   │
│  clear-transactions = deletes only transactions        │
└────────────────────────────────────────────────────────┘
```

---

## Running with Docker

```bash
docker-compose up --build
```

This spins up MySQL (port 3307), the backend (port 5000), and the frontend (port 3000 with nginx).

---

## API Overview

| Endpoint | Auth | Description |
|---|---|---|
| `POST /api/auth/register` | No | Register new user + create household |
| `POST /api/auth/login` | No | Login, returns JWT |
| `GET /api/categories` | Yes | List household categories |
| `PUT /api/categories/:id` | Yes | Update category budget/name |
| `POST /api/categories` | Yes | Add custom category |
| `DELETE /api/categories/:id` | Yes | Delete custom (non-default) category |
| `GET /api/transactions` | Yes | List transactions (paginated, filterable) |
| `POST /api/transactions` | Yes | Create transaction |
| `PUT /api/transactions/:id` | Yes | Update transaction |
| `DELETE /api/transactions/:id` | Yes | Delete transaction |
| `GET /api/summary/monthly?year=2026` | Yes | Totals per category per month |
| `GET /api/summary/dashboard?year=2026&month=6` | Yes | KPI + budget vs actual |
| `GET /api/export/monthly?year=2026&month=6&format=csv` | Yes | Download CSV/xlsx |

---

## Currency Handling

- All amounts are stored in **pence** (integers) to avoid floating-point bugs.
- Displayed as £ with comma formatting (e.g. £1,234.56).
- Input is accepted as decimal pounds (e.g. 12.99) and converted to pence server-side.
