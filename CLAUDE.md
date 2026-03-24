# CLAUDE.md — TallyRally Codebase Guide

## Project Overview

TallyRally is a **collaborative shopping list PWA** built with React + Firebase. Players join shared lists, check off items to earn points, and compete on a live scoreboard. Lists are shareable via URL and sync in real-time via Firestore.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 (functional components + hooks) |
| Routing | React Router DOM v6 (HashRouter) |
| Backend / DB | Firebase Firestore v10 (real-time subscriptions) |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| Build tool | Vite 5 |
| Deployment | Vercel |
| Styling | Vanilla CSS with custom properties (no CSS framework) |

## Directory Structure

```
TallyRally/
├── index.html              # HTML entry point (PWA meta tags)
├── vite.config.js          # Vite config (React plugin only)
├── vercel.json             # SPA rewrite rules + sw.js cache headers
├── .env.local.example      # Firebase env var template
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker (cache-first for shell assets)
│   └── icons/              # PWA icons (192px, 512px)
└── src/
    ├── main.jsx            # Bootstrap: registers SW, renders HashRouter
    ├── App.jsx             # Route definitions (3 routes)
    ├── index.css           # Global CSS custom properties + base styles
    ├── firebase.js         # Firestore init + exported utilities
    ├── components/
    │   ├── HomeView.jsx    # Create new list
    │   ├── JoinView.jsx    # Join existing list by ID
    │   ├── ListView.jsx    # Main list UI (orchestrates child components)
    │   ├── AddItemForm.jsx # Add item form (writes to Firestore)
    │   ├── ItemList.jsx    # Drag-and-drop sortable item list
    │   ├── Scoreboard.jsx  # Live player scores
    │   └── ShareButton.jsx # Web Share API / copy-to-clipboard
    └── hooks/
        ├── useListItems.js   # Firestore real-time items listener
        ├── useLocalOrder.js  # localStorage-based drag order (merged with Firestore)
        └── useScores.js      # Firestore real-time scores listener
```

## Routing

Routes are defined in `src/App.jsx` using HashRouter (hash-based URLs):

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `HomeView` | Create a new list |
| `/:listId` | `JoinView` | Enter player name to join list |
| `/:listId` (after join) | `ListView` | Main shopping list UI |

Player name is persisted in `localStorage` under `playerName`. Once set, joining a list goes straight to `ListView`.

## Firestore Data Model

```
/lists/{listId}
  - name: string
  - createdAt: Timestamp
  - lastActivityAt: Timestamp   # Updated on any write; used for TTL purging

/lists/{listId}/items/{itemId}
  - text: string
  - addedBy: string             # Player name
  - checkedOff: boolean
  - checkedBy: string | null
  - checkedAt: Timestamp | null
  - createdAt: Timestamp

/lists/{listId}/scores/{playerName}
  - name: string
  - points: number              # Incremented atomically via Firestore increment()
  - lastUpdated: Timestamp
```

## Key Patterns

### Real-Time Subscriptions
Firestore data is fetched via `onSnapshot` in custom hooks (`useListItems`, `useScores`). Always clean up listeners in the `useEffect` return function:

```js
useEffect(() => {
  const unsub = onSnapshot(query, (snap) => { /* ... */ });
  return () => unsub();
}, [listId]);
```

### Firestore Transactions
Check/uncheck operations use `runTransaction` to atomically update both the item and the player's score. Never split these into separate writes.

### Local Drag Order
`useLocalOrder.js` stores the item order in `localStorage` (key: `order_${listId}`). On each Firestore update it merges: preserves stored order for known items, appends new items at the end. This avoids round-trips to Firestore for UI-only reordering.

### lastActivityAt
Every write operation (add item, check/uncheck) must update `lastActivityAt` on the parent list document. This timestamp is used by backend TTL purging logic.

### Environment Variables
All Firebase config is loaded from Vite env vars (must be prefixed `VITE_`):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

Copy `.env.local.example` to `.env.local` and fill in values. On Vercel, set these as environment variables in the project settings.

## Development Workflow

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Production build (output: dist/)
npm run build

# Preview production build locally
npm run preview
```

There is **no test suite**. Manual testing against a Firebase project is the current workflow.

## Styling Conventions

Styles live in `src/index.css`. The design system uses CSS custom properties:

```css
--color-primary: #6C5CE7    /* Purple — buttons, accents */
--color-bg: #F5F3FF          /* Light lavender — page background */
--color-surface: #FFFFFF     /* White — cards, inputs */
--color-text: #2D3436        /* Dark gray — body text */
--color-checked: #00B894     /* Green — checked-off items */
--color-border: #E8E5F0      /* Light — borders */
```

- Mobile-first, max-width 480px container
- No external CSS framework — all styles are hand-written
- Use `transition: 0.15s–0.3s` for interactive state changes
- Safe area insets (`env(safe-area-inset-*)`) for notched devices

## Code Conventions

- **No TypeScript** — plain `.js` / `.jsx` files
- **No linter/formatter config** — keep code style consistent with existing files
- **Functional components only** — no class components
- **Custom hooks** for all Firestore logic — keep components focused on rendering
- **`useCallback` / `useMemo`** in hooks where appropriate to avoid re-renders
- **`aria-label`** on icon-only buttons for accessibility
- Error handling: `try/catch` in async functions with `console.error`; show user-facing messages via component state

## PWA / Service Worker

`public/sw.js` implements a **cache-first** strategy for the app shell and a **network-first** strategy for Firebase API calls. The shell cache (`tally-rally-v1`) includes: HTML, CSS, JS bundles, manifest, and icons. Do not cache Firebase URLs.

`vercel.json` disables browser caching for `/sw.js` so updates are picked up immediately.

## Deployment

Deployed on Vercel. All routes rewrite to `/index.html` (SPA behavior). Set Firebase env vars in the Vercel project dashboard. The `main` branch is the production branch.

## What to Watch Out For

- **Transactions are required** for check/uncheck — updating the item and score separately risks inconsistency.
- **Always update `lastActivityAt`** on any list write; omitting it breaks TTL purging.
- **Local order in `useLocalOrder`** is merged, not replaced — adding items to Firestore doesn't reset drag order.
- **Rate limiting** is implemented in `ListView.jsx` — respect existing debounce/throttle patterns when adding new write operations.
- **No authentication** — player identity is solely `localStorage` player name; do not add security-critical features without adding Firebase Auth first.
