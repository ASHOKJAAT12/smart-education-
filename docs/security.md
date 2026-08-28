# SmartLearn AI — Security

Current as of Phase 11 (production hardening). This documents what is
implemented, not aspirations. Known gaps are listed at the end.

---

## Threat model

SmartLearn AI holds student performance data and is used by three roles with
different privileges. The risks that matter most:

| Risk | Impact | Mitigation |
|---|---|---|
| Student reads another student's progress/attempts | Privacy breach | Ownership enforced inside query filters |
| Student escalates to teacher/admin | Full content control | Role read from DB per request, never from the client |
| Credential stuffing | Account takeover | Failure-only login limiter, bcrypt hashing |
| NoSQL injection | Auth bypass, data exposure | Global operator/key sanitizer |
| AI abuse | Provider cost, prompt injection | Per-user limits, input sanitization, output validation |
| Secret leakage via errors/logs | Total compromise | Generic production errors, log redaction |

---

## Authentication

- Passwords are hashed with bcrypt (cost from `BCRYPT_ROUNDS`, default 12). No
  endpoint returns a password or hash.
- JWT secrets come from `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`. Nothing is
  hardcoded. Startup validation (`src/config/env.js`) **refuses to boot in
  production** when a secret is shorter than 32 characters, matches a known
  placeholder, or when both secrets are identical.
- Token expiry is configured, not open-ended.
- Malformed, expired and not-yet-valid tokens are distinguished by the global
  error handler and returned as `401` with stable codes (`TOKEN_EXPIRED`,
  `TOKEN_INVALID`) so the frontend can react without parsing prose.

### Token handling — known limitation

Tokens are currently stored in browser `localStorage`, which is readable by any
successful XSS. Moving refresh tokens to `httpOnly` cookies is the correct fix
but changes the auth flow across every phase, so it is deliberately deferred
rather than half-done. **This is the most significant remaining security gap.**

---

## Authorization

Two layers, both server-side:

1. **Role** — `authenticate` loads the user from the database on every request
   and `authorize(...roles)` gates the route. The client's claimed role is never
   trusted; a token cannot grant a role the DB does not record.
2. **Ownership** — resource access is scoped in the *query filter*, not checked
   after loading:

```js
// Correct: a mismatched student simply finds nothing.
QuizAttempt.findOne({ _id: attemptId, studentId: req.user._id })
```

This pattern is used for quiz attempts and AI conversations. It fails safe: a
forged id returns 404 rather than another user's document.

Hidden UI is never treated as an access control. Direct URL access is protected
by the same middleware as navigated access.

---

## Input validation

`express-validator` runs before controllers on mutation endpoints. Validation
failures return `400` with a `details` array naming each offending field.
Mongoose validation is a backstop, not the primary defence.

Enforced: ObjectId format, enum membership, integer ranges, string lengths,
array sizes, and request-body size (1 MB ceiling in `app.js`).

Quiz submission specifically rejects out-of-range option indexes and ignores
duplicate answers for the same question, so a crafted payload cannot inflate a
score.

---

## NoSQL injection

`src/middleware/sanitize.js` runs globally and strips keys beginning with `$`,
keys containing `.`, and prototype-pollution keys (`__proto__`, `constructor`,
`prototype`) from body, query and params. Values are untouched, so ordinary text
containing `$` or `.` still works.

This blocks the classic operator-injection login bypass:

```json
{ "email": { "$gt": "" }, "password": { "$gt": "" } }
```

---

## Rate limiting

Defined centrally in `src/middleware/rateLimiters.js`. Authenticated requests are
keyed by user id so one user on a shared IP cannot exhaust everyone's budget.

| Limiter | Window | Max | Notes |
|---|---|---|---|
| general | 1 min | 200 | baseline for `/api` |
| login | 15 min | 10 | **failures only** — normal use never locks out |
| register | 1 hour | 5 | per IP |
| password reset | 1 hour | 5 | sends email; per IP |
| AI chat | 1 min | 15 | per user |
| AI generation | 10 min | 10 | most expensive operation |
| upload | 10 min | 20 | per user |
| admin sensitive | 5 min | 30 | per user |

---

## AI security

The model is treated as an untrusted text generator. It **never** decides
authorization, scores, mastery, or publication state.

- The API key lives only in `ai.provider.js`, read from the environment.
- `utils/aiGuard.js` neutralises prompt-injection phrasing before the request
  and validates every generated question after it. Malformed questions are
  **discarded, not repaired** — the previous code padded missing options with
  `"<answer> (Alternative Variant)"`, which revealed the answer.
- Generated questions are always stored `isPublished: false`. A teacher or admin
  must review and publish.
- Provider errors are logged server-side and returned as a generic `503`; raw
  provider messages can embed endpoint URLs and key fragments.
- Message length, history window, conversation length and question count are all
  capped (`config/constants.js`).
- In **production**, a missing API key returns `503` rather than fabricated demo
  text. Mock answers in a real student's tutor would be dishonest.

AI failure never blocks browsing lessons, practising, taking quizzes, viewing
progress, or receiving deterministic recommendations.

---

## Error handling

`src/middleware/errorHandler.js` is the single exit point. Every response uses:

```json
{ "success": false, "message": "Readable message", "errorCode": "OPTIONAL_CODE" }
```

Only deliberate `AppError`s and recognised library errors (Mongoose, JWT,
multer, body-parser) have their message forwarded. Anything else becomes
`"Something went wrong. Please try again."` in production. Stack traces are
development-only. Duplicate-key errors name the field but never echo the value,
which could be another user's email.

---

## Transport & headers

Set in `app.js` via Helmet: `frameguard: deny`, `referrerPolicy: no-referrer`,
`noSniff`, and HSTS in production only. CSP is disabled for this JSON API — it
would not protect the separately-hosted SPA and breaks docs tooling.

`x-powered-by` is disabled. `trust proxy` is set to exactly `1` in production so
`req.ip` is the real client without letting clients spoof `X-Forwarded-For`.

## CORS

Origins come from `CLIENT_URL` (comma-separated). Production allows **only**
configured origins — never `*`, since these endpoints are authenticated.
Development additionally allows the standard Vite ports. Rejected origins are
logged and denied by omitting CORS headers rather than raising a 500.

---

## Logging

`utils/logger.js` emits JSON lines in production and recursively redacts
secret-looking keys (passwords, tokens, JWT secrets, Cloudinary/Brevo/AI keys,
Mongo URI) before writing. Tracked events include auth failures, AI failures,
rate limiting, sanitized requests, upload/email failures and admin actions.

---

## Email

Credentials are backend-only. Reset links expire in 10 minutes, are
single-use, and the token is hashed at rest. Forgot-password returns the same
response whether or not the account exists, so it cannot be used to enumerate
users. Email failure does not fail the request.

---

## Remaining gaps

| Severity | Issue |
|---|---|
| High | Tokens in `localStorage` — XSS-readable. Needs `httpOnly` cookie refresh flow. |
| Medium | No automated test suite. Verification so far is syntax + build only; the security matrix has **not** been executed against a running server. |
| Medium | Ownership pattern confirmed for quiz attempts and AI conversations; teacher/admin content ownership not yet re-audited in this phase. |
| Medium | Rate limits are in-process. Multiple instances multiply the effective limit; a shared store is needed to scale horizontally. |
| Low | Dependency vulnerability audit not run. |
