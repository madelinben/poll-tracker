# Poll Tracker

Find a date or decide together: share one link, everyone adds their answers, no sign-up.

- Date polls or option polls (where to go, which activity)
- Yes, maybe or no per option; the best option is highlighted
- The whole poll lives in the link (compressed by the browser), so there is no server and no account: answer, then share the updated link back to the group
- Recent polls remembered in this browser


Two ways this repo ships, from the same `src/`:

| Target | How |
|---|---|
| **GitHub Pages** (`madelinben.github.io/poll-tracker/`) | `pnpm build:demo` builds `demo/` into `docs/` (Pages source: `main` / `/docs`) |
| **get-out-there** (Cloudflare) | imported as workspace package `@get-out-there/poll` (`PollApp`) |

```bash
pnpm install
pnpm dev          # demo at http://localhost:3110/poll-tracker/
pnpm test         # logic unit tests
pnpm build:demo   # static site -> docs/
```

Package rules: no router/auth/app imports; Tailwind default palette only (no custom tokens); host must `@source` this folder. Peer deps: react, react-dom, lucide-react.
