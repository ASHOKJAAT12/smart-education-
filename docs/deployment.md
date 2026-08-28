# SmartLearn AI — Deployment

Frontend and backend deploy independently. Nothing is hardcoded to a host — the
frontend reads `VITE_API_URL`, the backend reads `CLIENT_URL`.

---

## Verified locally

| Check | Command | Result |
|---|---|---|
| Backend parses (all `src/**.js`) | `npm run verify` (in `backend/`) | 88/88 files OK |
| Frontend production build | `npm run build` (in `frontend/`) | Success, ~9.9s |

Frontend bundle: `701 kB` raw / `196 kB` gzipped in a single chunk. Vite warns
about the 500 kB threshold. This is acceptable for a hackathon demo but
route-level code splitting is the obvious next optimisation.

**Not yet verified:** the backend has not been booted against a live database in
this phase, and no automated tests exist. Treat runtime behaviour as unproven
until the smoke tests below are executed.

---

## Backend

Start command: `npm start` (`node src/server.js`). Node >= 18.

Startup will **abort** if `MONGODB_URI`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET` or `CLIENT_URL` is missing. In production it also aborts on
secrets under 32 characters, placeholder secrets, or identical access/refresh
secrets. This is intentional — a silent weak-secret deploy is worse than a failed
one.

### Environment

See `backend/.env.example` for the full annotated list. Required:

```
MONGODB_URI
JWT_ACCESS_SECRET      # 32+ random chars, different from refresh
JWT_REFRESH_SECRET     # 32+ random chars
CLIENT_URL             # comma-separated exact frontend origins, no trailing slash
NODE_ENV=production
```

Optional (each degrades gracefully): `AI_API_KEY`, `CLOUDINARY_*`, `BREVO_*`.

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Health endpoints

| Endpoint | Purpose | Behaviour |
|---|---|---|
| `GET /api/v1/health` | liveness | Always 200 while the process runs. Does **not** touch the DB, so a transient outage cannot trigger a restart loop. |
| `GET /api/v1/health/ready` | readiness | 200 only when Mongo is connected; 503 otherwise so the load balancer drains traffic. |

Point the platform's health check at `/api/v1/health` and any load-balancer
readiness probe at `/api/v1/health/ready`.

### Proxy

`trust proxy` is set to `1` in production. Without it, every user shares one
rate-limit bucket behind the platform's TLS terminator. It is deliberately not
`true`, which would let clients spoof `X-Forwarded-For`.

---

## Frontend

Build: `npm run build` → static output in `frontend/dist/`.

Set `VITE_API_URL` **at build time** (Vite inlines it; changing it later requires
a rebuild):

```
VITE_API_URL=https://api.your-domain.com/api/v1
```

### SPA routing

React Router uses client-side routes, so the host must rewrite unknown paths to
`index.html` or a refresh on `/student/dashboard` returns 404.

- **Netlify** — `public/_redirects`: `/*  /index.html  200`
- **Vercel** — `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- **Nginx** — `try_files $uri $uri/ /index.html;`

---

## Database

MongoDB Atlas is the expected host.

1. Restrict network access to the backend's egress IPs where the platform
   provides static addresses; otherwise scope as narrowly as the platform allows.
2. Use a dedicated user with read/write on the app database only — not an admin
   or cluster-wide user.
3. Indexes are declared in the Mongoose schemas and created on connection.
   `QuizAttempt` carries `{studentId, createdAt}`, `{studentId, quizId, status}`
   and `{topicId, submittedAt}`, matching the history, resume-guard and analytics
   queries respectively.

### Backup & recovery

Use Atlas's built-in backups rather than building anything custom.

- **Backups:** enable continuous cloud backup on the cluster. Atlas retains
  snapshots per its policy; no application code is involved.
- **Recovery:** restore a snapshot to a new cluster, update `MONGODB_URI`,
  redeploy. Expect minutes, not seconds.
- **Secrets:** environment variables are *not* backed up with the database. Store
  them in a password manager or the platform's secret store. Losing
  `JWT_*` invalidates all sessions (users must sign in again) but destroys no data.
- **Cloudinary assets:** live outside MongoDB and are not covered by a DB
  restore. A restored database may reference assets that were deleted from
  Cloudinary; resource records should be treated as best-effort after a restore.

---

## External services

| Service | Failure behaviour |
|---|---|
| AI provider | Endpoints return 503 with a friendly message. Lessons, practice, quizzes, progress and deterministic recommendations all keep working. |
| Cloudinary | Uploads are disabled; existing content unaffected. |
| Brevo | Emails are logged instead of sent in development. Password reset links then only appear in server logs. |

---

## CORS checklist

Getting this wrong is the most common deploy failure:

- `CLIENT_URL` must be the **exact** origin including scheme, with **no trailing
  slash**: `https://app.example.com`, not `https://app.example.com/`.
- Multiple origins are comma-separated (e.g. apex plus `www`).
- Production never falls back to `*`. A missing `CLIENT_URL` in production is
  logged as a warning and browser requests will be blocked.

---

## Post-deploy smoke test

Run these against the live deployment before demoing:

```
GET  /api/v1/health          → 200
GET  /api/v1/health/ready    → 200 (else the DB connection is wrong)
```

Then in the browser: register → login → onboarding → assessment → view
recommendations → open a topic → take a quiz → confirm the score and that
progress/recommendations changed. If the AI key is configured, also send one
tutor message.
