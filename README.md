# OSRS Companion App

Old School RuneScape companion tools — a DPS calculator, equipment search,
hiscores lookup, and a progression map. React + Vite on the front end,
Firebase (Hosting, Auth, Realtime Database, Cloud Functions) behind it.

Deployed at <https://scapemate.net>.

## Layout

| Path         | What it is                                                   |
| ------------ | ------------------------------------------------------------ |
| `frontend/`  | Vite + React + TypeScript app, MUI for UI, Konva for the map |
| `functions/` | Cloud Functions — an Express proxy for the OSRS hiscores API |
| `scripts/`   | Validated OSRS data sync and documented exception layer      |

## Prerequisites

- Node.js 22 or newer (`functions/` pins Node 22 to match the Cloud Functions runtime)
- Python 3.10+, only if you need to refresh the game data
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

| Command              | What it does                               |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Dev server on port 5173                    |
| `npm run dev:all`    | Dev server **and** the functions emulator  |
| `npm run emulators`  | Functions emulator only                    |
| `npm run build`      | Typecheck (`tsc -b`) then bundle           |
| `npm run typecheck`  | Typecheck only                             |
| `npm run lint`       | ESLint                                     |
| `npm test`           | Vitest, single run                         |
| `npm run test:watch` | Vitest in watch mode                       |
| `npm run coverage`   | Vitest with a coverage report              |
| `npm run data:sync`  | Download and regenerate OSRS data          |
| `npm run data:check` | Validate generated data and its unit tests |
| `npm run verify`     | Run all local data and frontend checks     |

`npm run build` fails on type errors. That is deliberate — it previously ran
`vite build` alone, which strips types without checking them.

## Emulators

The Connect page and the hiscores lookup call the Cloud Functions API. Every
other feature reads Firebase or the static JSON directly, so for ordinary UI
work `npm run dev` alone is enough. For those two, run both together:

```bash
cd frontend && npm run dev:all
```

Both scripts set `NODE_ENV=development`, which is what puts localhost in the
API's CORS allow-list. Without it the emulator behaves like production and
rejects the browser with an opaque "Failed to fetch".

Only the _functions_ emulator starts, deliberately. If the database emulator
ran too, the function would write pairing codes into an emulated database
while the Connect page reads the real one, and pairing would appear to do
nothing. As it is, the Admin SDK writes to the real database.

The emulators bind to `0.0.0.0` so you can test from another device on the
same network. Emulator UI is on port 4000.

## Regenerating game data

The JSON in `frontend/public/` is converted from the free, open dataset built
by the [OSRS Wiki DPS calculator](https://github.com/weirdgloop/osrs-dps-calc).
It is pinned to one upstream commit, validated before replacement, and refreshed
daily by `.github/workflows/sync-osrs-data.yml`:

```bash
cd frontend
npm run data:sync
npm run data:check
```

No Python packages are required. Data corrections and exclusions belong in
`scripts/osrs_data_overrides.json`, where every ID patch must include a reason
and source. See `scripts/README.md` for the format and maintenance policy.

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
