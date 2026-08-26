# SmartLearn AI — Technical Specification
## Section 11: Security Plan

---

## 11.1 Input Validation & Sanitization

- All API request bodies validated with **express-validator** or **Zod** on the server.
- Unknown fields are stripped (whitelist approach).
- String lengths capped per field (e.g., quiz answer max 1000 chars).
- No raw HTML accepted in text fields; strip HTML tags before saving.

---

## 11.2 Authorization

- Every route explicitly declares its required role.
- Student cannot access teacher/admin routes.
- Teacher can only modify resources they created (`createdBy === req.user._id`).
- Admin has full access.
- No reliance on client-side auth checks for security decisions.

---

## 11.3 Password Security

- bcryptjs with cost factor 12.
- Minimum 8 chars, at least 1 uppercase, 1 number.
- Password never returned in any API response.
- Password reset tokens are single-use and expire in 10 minutes.

---

## 11.4 JWT Security

- Access tokens: 15-min expiry, signed with `JWT_ACCESS_SECRET` (min 256-bit).
- Refresh tokens: 7-day expiry, `httpOnly`, `Secure`, `SameSite=Strict` cookie.
- Tokens never stored in localStorage (XSS protection).
- Token blacklist not required (short expiry); forced logout via refresh token invalidation.

---

## 11.5 Rate Limiting

| Endpoint Group | Limit | Window |
|---|---|---|
| Auth endpoints | 10 req | 15 min / IP |
| AI endpoints | 20 req | 24 hr / user |
| General API | 100 req | 1 min / IP |

Tool: `express-rate-limit`. Future: Redis for distributed rate limiting.

---

## 11.6 CORS

```js
cors({
  origin: [process.env.CLIENT_URL],   // strict: no wildcard in production
  credentials: true,                   // required for cookie / refresh token
  methods: ['GET','POST','PATCH','DELETE']
})
```

---

## 11.7 File Upload Validation

Before Cloudinary upload:
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
- Max file size: 10 MB.
- No executable files allowed.
- Filename sanitized before storage.

---

## 11.8 MongoDB Security

- Mongoose schema validation prevents unexpected fields.
- All queries use Mongoose methods (no raw string-interpolated queries).
- MongoDB connection string in environment variable only.
- `lean()` used on read-heavy, non-mutating queries for performance.

---

## 11.9 AI Prompt Abuse Protection

- System prompt injection mitigated: user input appended after system prompt, never interleaved.
- Max user message length: 500 chars for tutor; 200 chars for explain.
- Profanity/abuse filter (simple blocked-words list) applied to user input before LLM call.
- All AI conversations stored for audit.

---

## 11.10 Environment Variables

Never committed to git. All secrets in `.env`:

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
BCRYPT_ROUNDS=12
CLIENT_URL=https://smartlearnai.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=...
BREVO_SMTP_PASS=...
AI_PROVIDER=openai
OPENAI_API_KEY=...
AI_DAILY_QUOTA=20
```

`.env.example` committed with placeholder values only.

---

## 11.11 HTTP Security Headers (Helmet.js)

```js
app.use(helmet());
// Sets: X-Content-Type-Options, X-Frame-Options, HSTS, 
//       X-XSS-Protection, Referrer-Policy, CSP
```

---

## 11.12 Error Responses

- Never reveal stack traces in production responses.
- Global error handler returns `{ error: "message" }` only.
- Error logging uses a structured logger (Winston).
