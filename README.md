# OSRS Companion App

Old School RuneScape companion tools — a DPS calculator, equipment search,
hiscores lookup, and a progression map. React + Vite on the front end,
Firebase (Hosting, Auth, Realtime Database, Cloud Functions) behind it.

Deployed at <https://scapemate.net>.

## Layout

| Path         | What it is                                                         |
| ------------ | ------------------------------------------------------------------ |
| `frontend/`  | Vite + React + TypeScript app, MUI for UI, Konva for the map       |
| `functions/` | Cloud Functions — an Express proxy for the OSRS hiscores API       |
| `scripts/`   | Python scrapers that regenerate the game data in `frontend/public` |

## Prerequisites

- Node.js 22 or newer (`functions/` pins Node 22 to match the Cloud Functions runtime)
- Python 3.9+, only if you need to re-run the scrapers
- `npm install -g firebase-tools`

## Setup

```bash
cd frontend
cp .env.example .env    # then fill in the values
npm install
npm run dev
```

The Firebase web config in `.env` is not secret — it ships in the client
bundle by design. Access is controlled by the Realtime Database rules in
`database.rules.json`, not by keeping those values hidden.

`VITE_REACT_APP_API_URL` points at the Cloud Functions API. For local work
run the emulators (below) and use the emulator URL.

## Everyday commands

Run these from `frontend/`:

| Command              | What it does                     |
| -------------------- | -------------------------------- |
| `npm run dev`        | Dev server on port 5173          |
| `npm run build`      | Typecheck (`tsc -b`) then bundle |
| `npm run typecheck`  | Typecheck only                   |
| `npm run lint`       | ESLint                           |
| `npm test`           | Vitest, single run               |
| `npm run test:watch` | Vitest in watch mode             |
| `npm run coverage`   | Vitest with a coverage report    |

`npm run build` fails on type errors. That is deliberate — it previously ran
`vite build` alone, which strips types without checking them.

## Emulators

```bash
cd functions && npm install
firebase emulators:start
```

The emulators bind to `0.0.0.0` so you can test from another device on the
same network. Emulator UI is on port 4000.

## Regenerating game data

The JSON in `frontend/public/` is scraped from the OSRS Wiki:

```bash
cd scripts
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python osrs_scraper_monster_stats.py
python osrs_scraper_weapon_armor_stats.py
```

## Deploying

```bash
cd frontend && npm run deploy   # build + deploy hosting
cd functions && npm run deploy  # deploy functions
```

Database rules live in `database.rules.json`, which mirrors what is
deployed. Change them there, not in the console, then:

```bash
firebase deploy --only database
```
