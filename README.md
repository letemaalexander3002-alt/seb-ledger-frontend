# SEB-Ledger Frontend

**The Pan-East African Informal Sector Economic Ledger** — official dashboard
interface for The Sovereign Ecosystem Blueprint (SEB), built by Letema Group.

## Stack

- React 18 + Vite 5
- Tailwind CSS 3 (custom "Obsidian / Ledger / Gold / Platinum" token system)
- lucide-react for iconography
- No charting library dependency — `RealTimeChart` is a hand-rolled SVG
  area/line chart so the bundle stays lean and the visual language stays
  fully custom to the ledger aesthetic.

## Getting started

```bash
npm install
cp .env.example .env.local   # point VITE_BACKEND_URL at your Express server
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies any request to
`/api/*` through to `VITE_BACKEND_URL` (default `http://localhost:3000`,
matching seb-ledger-core's default `PORT`), so the dashboard can be
developed against your live Express/Supabase backend core with zero CORS
configuration.

```bash
npm run build      # production build to dist/
npm run preview    # preview the production build locally
```

## Backend contract

`src/utils/api.js` is the single source of truth for every network call.
Every dashboard component reads through it — none call `fetch` directly.
This wraps the **actual** routes exposed by `seb-ledger-core`'s
`server.js` (not a hypothetical richer API):

| Method | Path                                              | Used by                |
|--------|---------------------------------------------------|------------------------|
| GET    | `/health`                                          | —                      |
| GET    | `/api/v1/merchants?search=&region=&page=&page_size=` | `MerchantTable`     |
| POST   | `/api/v1/merchants`                                | `RegisterMerchantForm` |
| POST   | `/api/v1/webhooks/mobile-money`                    | `WebhookSimulator`     |
| GET    | `/api/v1/analytics/cognitive-score/:merchant_id`   | (available, not yet wired into a component) |
| GET    | `/api/v1/governance/dashboard`                     | `StatCards`            |

Notes on what's intentionally **not** real:

- `RealTimeChart` has no backing endpoint — `seb-ledger-core` doesn't
  expose a timeseries/history route, only the single-snapshot governance
  dashboard above. The chart is clearly labeled "Illustrative" in the UI
  rather than silently faking a live feed.
- There's no merchant `status` (active/pending/suspended) concept beyond
  the boolean `is_active` column, and no per-merchant "channel" or
  "volume" — those don't exist in the `merchants` table. `MerchantTable`
  only renders fields that are actually on the row.
- `GET /api/v1/governance/dashboard` may require an `X-Admin-Key` header
  if the backend has `ADMIN_API_KEY` set — configure `VITE_ADMIN_API_KEY`
  to match (see `.env.example`).

Whenever the backend is unreachable (or, for the dashboard, the admin key
is missing/wrong), every component degrades gracefully to realistic mock
data shaped exactly like the real response — useful for demos, design
review, and frontend development in isolation — and clearly flags that
it's showing demonstration data rather than live figures.

## Design system

The interface is built around a literal ledger-book metaphor rather than a
generic SaaS card grid:

- **Ledger Spine** — the signature element: a narrow left rail styled as a
  physical ledger's binding, carrying primary navigation.
- Flat surfaces, hairline gold-tinted borders, square corners — no drop
  shadows or rounded "card" treatments.
- `Spectral` serif for the wordmark/title (ledger-book gravity), `Inter`
  for UI text, `IBM Plex Mono` with tabular figures for every numeral so
  currency and ID columns align like a real bound ledger.
- Palette: Obsidian black canvas, Imperial Gold accent, Platinum grey body
  text, Emerald for inflow, Rust/terracotta for outflow — deliberately
  avoiding generic SaaS green/red.

See `DESIGN_NOTES.md` in this folder for the full token system and design
rationale.

## Folder structure

```
seb-ledger-frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env.example
├── build_frontend_zip.py
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── utils/
    │   └── api.js
    └── components/
        ├── StatCards.jsx
        ├── RealTimeChart.jsx
        ├── MerchantTable.jsx
        ├── RegisterMerchantForm.jsx
        └── WebhookSimulator.jsx
```

## Packaging for distribution

```bash
python3 build_frontend_zip.py
```

Produces a timestamped `.zip` in the parent directory, excluding
`node_modules`, `dist`, `.git`, and local env files.
