# Client Manager — Engineering Office

Internal client management system for an engineering office. Hebrew UI, RTL layout.

---

## What It Does

- Manage clients with property details (גוש / חלקה / מגרש) and work types
- Track planning workflow per client: architecture offer → visualization (state machine)
- Automatic notifications for stalled work (e.g. offer not started, in progress too long, ready to contact)
- Snooze notifications per client, persisted across page refreshes

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React (Create React App, JavaScript) |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| Styling | Custom CSS, RTL |
| Notifications | In-memory, no DB — computed from client state |
| Snooze storage | `localStorage` |

---

## Getting Started

```bash
npm install
npm start       # dev server at http://localhost:3000
npm run build   # production build
```

Create a `.env` file in the project root from `.env.example` and enter the project URL and public anon/publishable key from **Supabase → Project Settings → API**:
```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

In PowerShell, start with `Copy-Item .env.example .env`. Restart `npm start` after editing `.env`. Never put a Supabase service-role key in this React app or commit `.env`.

The app expects the Supabase tables `profiles`, `offices`, `clients`, and `row_reminders`, plus the `admin-users` Edge Function for staff management. Configure Auth, database tables, and row-level security policies in your Supabase project before signing in. The service-role key belongs only in the Edge Function's server-side secrets.

---

## File Map

```
src/
├── App.js                  # Root — state, fetching, view routing
├── App.css                 # All styles
├── constants/index.js      # All magic strings/keys — change names here only
│
├── components/
│   ├── Sidebar.js          # Nav + notification badge
│   ├── ClientDetail.js     # Client detail + tabs
│   ├── ClientForm.js       # Create/edit form (dirty-check guard)
│   ├── PlanningTab.js      # Planning workflow UI
│   ├── Inbox.js            # Notification list + snooze
│   ├── Login.js            # Auth screen
│   ├── Router.js           # Auth-gated view switch
│   └── ErrorBoundary.js    # Top-level error catcher
│
├── contexts/
│   └── AuthContext.js      # Supabase auth + user profile
│
└── notifications/
    ├── rules.js            # ← ADD NEW RULES HERE
    ├── engine.js           # Pure function: computes active notifications
    └── useNotifications.js # Hook: timer tick + snooze state
```

---

## Notification Rules

Rules live in `src/notifications/rules.js`. Each rule fires when:
1. `rule.check(client)` returns `true`
2. `rule.delayDays` units have passed since `client.created_at`
3. The notification is not currently snoozed

To add a rule, append an object to `NOTIFICATION_RULES`:
```js
{
  type: NOTIF_TYPE_MY_RULE,           // constant from constants/index.js

---

## Planned features

- Per-row notification delays: allow configuring how many days until a notification fires for each row/item in a status table.
- Centralized plan: see `.plans/NotificationPlan.md` for the agent-ready prompt and implementation plan.

  delayDays: 3,
  check: (client) => /* condition */,
  getMessage: (client, elapsed) => `some Hebrew text — ${elapsed} ימים`,
}
```

**Test mode:** set `NOTIFICATION_DELAY_UNIT = 'minutes'` in constants to make 1 day = 1 minute.

---

## Planning Workflow

For clients with type `תכנון` + architecture discipline:

```
arch_offer_status:  not_started → in_progress → ready → agreed
                                                           ↓
arch_viz_status:                              not_started → in_progress → ready → agreed
```

Visualization tab is locked until offer reaches `agreed`.

---

## Client Labels

| Label | Meaning |
|---|---|
| לקוח חדש | New — just created, not yet active |
| לקוח פעיל | Active permanent client |
| לא פעיל | Inactive — hidden from notifications, shown at bottom of list |

---

## Key Decisions

- **No notifications DB table** — notifications computed in memory from clients array on every 60s tick. Simpler, no RLS issues.
- **All magic strings in `constants/index.js`** — rename a label or key in one place only.
- **Single `useNotifications` instance in App.js** — ensures badge count and inbox are always in sync.

---

## Skills

Run after making changes to catch issues early. Fix errors first, then re-run to verify the score improved.

npx -y react-doctor@latest . --verbose --diff

---

## Desktop App (Electron)

`.env` is baked into the build, so make sure it points at the production Supabase project first.

| Command | What it does |
|---|---|
| `npm run electron:dev` | Dev server + Electron window with hot reload |
| `npm run electron:build` | Windows installer → `dist/Client Manager-Setup-<version>.exe` |
| `npm run electron:build:mac` | macOS `.dmg` (must run on a Mac) |
| `npm run electron:publish` | Builds and uploads the installer to a **draft** GitHub Release (needs `GH_TOKEN` with repo scope) |
| `npm run electron:icon` | Regenerates `buildResources/icon.png` from the brand logo |

Bump `version` in `package.json` before each release. The installer is unsigned, so Windows SmartScreen shows "unknown publisher" until a code-signing certificate is configured (`win.certificateFile` / `CSC_LINK`).
