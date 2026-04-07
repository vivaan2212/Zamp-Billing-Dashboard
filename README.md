# Zamp Billing Dashboard

Internal billing dashboard for Zamp revenue reporting. **Not for public hosting.**

## Local Setup

```bash
# 1. Clone
git clone https://github.com/vivaan2212/Zamp-Billing-Dashboard.git
cd Zamp-Billing-Dashboard

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local.example .env.local
# Edit .env.local and add the DATABASE_URL (get from Pace DB secrets)

# 4. Run locally
npm run dev
# Opens at http://localhost:3000
```

## Stack
- Next.js 14 (App Router)
- Tailwind CSS
- Postgres (Pace DB via psycopg2-compatible pg client)

## Features
- Monthly billing metrics per client (done runs, billed revenue, LLM cost, gross margin)
- Rate configuration with approval workflow
- Change request queue with approve/reject actions

## DB Tables Used
- `billing_clients` — client registry
- `billing_config` — rate config (status: active / superseded)
- `billing_monthly_metrics` — pre-computed monthly rollups
- `billing_change_requests` — rate change audit trail
