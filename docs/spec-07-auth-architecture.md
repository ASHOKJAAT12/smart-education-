# SmartLearn AI — Technical Specification
## Section 7: Authentication Architecture

---

## 7.1 JWT Strategy

SmartLearn AI uses a **dual-token strategy**:

| Token | Storage | Expiry | Purpose |
|---|---|---|---|
| **Access Token** | Memory (React state / Axios header) | 15 minutes | Authorize API requests |
| **Refresh Token** | `httpOnly` cookie (`Secure`, `SameSite=Strict`) | 7 days | Obtain new access token silently |

**Token payload (access token):**
```json
{
  "sub": "<userId>",
  "role": "student",
  "iat": 1234567890,
  "exp": 1234568790
}
```

No sensitive data (email, password) inside token payload.

---

## 7.2 Token Flow

```
1. User logs in → POST /auth/login
2. Server validates credentials
3. Server signs accessToken (JWT, 15 min) + refreshToken (JWT, 7 days)
4. accessToken returned in response body
5. refreshToken set as httpOnly cookie
6. Frontend stores accessToken in memory (NOT localStorage)
7. On 401, Axios interceptor → POST /auth/refresh-token (sends cookie)
8. Server verifies refresh token → issues new accessToken
9. If refresh token expired → redirect to login
```

---

## 7.3 Password Hashing

- Library: `bcryptjs`
- Cost factor: **12** (configurable via `BCRYPT_ROUNDS` env var)
- Hash generated at registration and password change; never stored raw.
- Comparison done server-side only.

---

## 7.4 Role-Based Authorization (RBAC)

Three roles: `student`, `teacher`, `admin`.

Middleware chain on protected routes:
```
verifyToken → extractRole → checkRole(['teacher','admin'])
```

RBAC middleware example:
```js
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

Admin can access all routes. Teachers access their own content. Students access only student APIs.

---

## 7.5 Password Reset Flow

```
1. POST /auth/forgot-password { email }
   → Always respond 200 (prevents email enumeration)
   → Internally: generate crypto.randomBytes(32) token
   → Store sha256(token) on User + expires in 10 minutes
   → Send plain token in email link

2. User clicks link → Frontend sends POST /auth/reset-password/:token { password }
   → Server hashes incoming token, compares to stored hash
   → Checks expiry
   → Updates password, clears token
```

---

## 7.6 Email Verification (Optional for Hackathon, Recommended for Production)

```
1. On register → generate emailVerificationToken
2. Send verification link by email
3. GET /auth/verify-email/:token → set isEmailVerified = true
```

---

## 7.7 Security Headers

Applied via `helmet()`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`
- `Strict-Transport-Security` (HTTPS only)

---

## 7.8 Auth Rate Limiting

```js
// Auth endpoints only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 attempts
  message: { error: 'Too many requests, slow down.' }
});
app.use('/api/auth', authLimiter);
```
