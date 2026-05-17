**Authentication Plan**

This document describes the schema, middleware, controllers, responses, services and sample queries for the authentication flow for these routes:

POST /api/v1/auth/register       → Email verification
POST /api/v1/auth/login          → Access + refresh tokens
POST /api/v1/auth/refresh        → Token rotation
POST /api/v1/auth/logout         → Revoke tokens
POST /api/v1/auth/forgot-password → send token
POST /api/v1/auth/resend-otp
POST /api/v1/auth/reset-password
GET  /api/v1/auth/verify-otp     → Email confirmation

**Schema (Postgres)**
- `users` (existing table, ensure columns below):
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - `email` TEXT UNIQUE NOT NULL
  - `password_hash` TEXT NOT NULL
  - `is_verified` BOOLEAN NOT NULL DEFAULT false
  - `role` TEXT NOT NULL DEFAULT 'user' -- enum: user|admin
  - `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
  - `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
  - Index: `idx_users_email` ON (lower(email))

- `otp_codes` (you already have this table; recommended columns):
  - `id` UUID
  - `user_id` UUID REFERENCES users(id) ON DELETE CASCADE
  - `code` TEXT NOT NULL (store hashed or plaintext short lived)
  - `type` TEXT NOT NULL -- verification|reset
  - `expires_at` TIMESTAMP WITH TIME ZONE NOT NULL
  - `consumed` BOOLEAN DEFAULT false

Security notes: store refresh token *hash* (bcrypt or SHA256+pepper). Access tokens are short-lived JWTs (15m). Refresh tokens rotate: issue new refresh token on every `refresh` call and mark previous token `revoked=true`.

**Zod validation schemas (high level)**
- `registerSchema` { email: string.email(), password: string.min(8), schoolId?: string }
- `loginSchema` { email: string.email(), password: string }
- use jwt for refresh token
- `forgotPasswordSchema` { email: string.email() }
- `resendOtpSchema` { email: string.email() }
- `resetPasswordSchema` { token: string, newPassword: string.min(8) }
- `verifyOtpSchema` { code: string, email?: string }

**Middleware**
- `validate(schema)` - route-level validator using Zod, returns 400 with field errors.
- `requireAuth` - verifies `Authorization: Bearer <accessToken>` JWT:
  - verify signature, check `exp`, `jti` and `sub` (user id)
  - check Redis blocklist for `jti` (if access token revoked on logout)
  - attach `req.user = { id, email, role }`
- `requireRole(role)` - checks `req.user.role`.
- `rateLimit` - per-route rate limiter (login/register/otp endpoints stricter); use Redis sliding window.

Implementation notes:
- use jwt for refresh token too
**Controllers (behaviour)**
- `POST /auth/register`:
  1. Validate input.
  2. If email exists and not verified -> resend OTP; if exists and verified -> 409.
  3. Create user with `password_hash` (bcrypt cost 12).
  4. Create OTP record (`otp_codes`) type=verification, expires in 15 minutes also hashed.
  5. Send verification email (link or OTP) via `mailService`.
  6. Return 201: { success: true, message: 'verification sent', data: {} }

- `GET /auth/verify-otp`:
  1. Validate code (and optional email).
  2. Lookup `otp_hashed_codes` for user/email & type=verification, not expired, not consumed.
  3. Mark `otp_codes.consumed = true` and set `users.is_verified = true` in a transaction.
  4. Optionally auto-login: issue access + refresh tokens, set refresh cookie.
  5. Return 200: { success: true, message: user registered successfully, data: {user: {id, email, role, schoolId, status, points, badge}, token, token_expires_in, refreshtoken} }

- `POST /auth/login`:
  1. Validate input.
  2. Find user by email, verify password via bcrypt.compare.
  3. If not verified, return 403 (or send verification OTP).
  4. Create access token JWT and refresh token (random long string or JWT with jti).
  5. Hash refresh token and store in `refresh_tokens` with `jti`, expires_at.
  6. Set refresh token cookie with `httpOnly`, `secure`, `SameSite=Strict`, `maxAge`.
  7. Return 200: { success: true, message: user logged in successfully, data: {user: {id, email, role, schoolId, status, points, badge}, token, token_expires_in, refreshtoken} }

- `POST /auth/refresh` (rotation):
  1. `parseRefreshToken` -> get token string.
  2. Verify token format & parse `jti` (if JWT) or parse stored metadata.
  3. Lookup hashed token in `refresh_tokens` by `jti` and `user_id`.
  4. If not found or revoked or expired -> 401.
  5. Delete or mark old token `revoked=true` (atomic) and insert new hashed refresh token (new jti). Use transaction.
  6. Issue new access token and new refresh token; set cookie with new refresh token.
  7. Return 200: { success: true, message: token generated successfully, data: { token, token_expires_in } }

- `POST /auth/logout`:
  1. `parseRefreshToken` -> find matching refresh token row; mark `revoked=true`.
  2. Add current access token `jti` to Redis blocklist with TTL = remaining `exp`.
  3. Clear refresh cookie (set expired cookie).
  4. Return 200: { success: true, message: user logged out successfully, data: {}  }

- `POST /auth/forgot-password`:
  1. Validate input.
  2. If user exists, create OTP or reset token (cryptographically random) saved in `otp_codes` and type= `forgot_password` with short expiry.
  3. Send email with one-time link or token via `mailService`.
  4. Return 200: { success: true, message: token sent to registered email, data: {} }

- `POST /auth/resend-otp`:
  1. Validate input.
  2. Rate-limit per email+IP.
  3. Insert new OTP and send email.
  4. Return 200: { success: true, message: otp resent successfully, data: {} }

- `POST /auth/reset-password`:
  1. Validate input: otp-token + newPassword.
  2. Verify token/OTP, ensure not expired and not consumed.
  3. Update `users.password_hash = bcrypt(newPassword)`.
  4. Revoke all refresh tokens for user (mark `revoked=true`).
  5. Return 200: { success: true, message: password reset successfully, data: {user: {id, email, role, schoolId, status, points, badge}, token, token_expires_in, refreshtoken} }

**Responses (standard shapes)**
- Success envelope: `{ success: true, data?: any, message?: string }`
- Error envelope: `{ success: false, error: { code: string, message: string, details?: Record<string,any> } }`

Common error codes:
- `AUTH_INVALID_CREDENTIALS`, `AUTH_NOT_VERIFIED`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_REVOKED`, `RATE_LIMITED`, `VALIDATION_ERROR`

**Services (high level)**
- `authService`:
  - `register(email, password, meta)`
  - `login(email, password)`
  - `refresh(oldRefreshToken)`
  - `logout(userId, refreshToken)`
  - `forgotPassword(email)`
  - `resetPassword(token, newPassword)`

- `tokenService`:
  - `createAccessToken(payload: { sub, role, jti })` // JWT HS256, 15m
  - `createRefreshToken()` // long random string or JWT with jti, 30d
  - `hashToken(token)` // bcrypt or SHA256+pepper
  - `verifyHashedToken(token, tokenHash)`

- `userService`:
  - `createUser`, `findByEmail`, `findById`, `updatePassword`, `markVerified`

- `otpService`:
  - `generateOtp(userId, type)`, `verifyOtp(userId, code, type)`, `invalidateOtp`

- `mailService`:
  - `sendVerificationEmail(email, codeOrLink)`, `sendResetEmail`, `sendLoginNotification`

Implementation notes:
- Use the testing on ../mdaas-lucent-backend as a template.
- Use a small queue (bullmq) for sending emails in production; for MVP send inline but try/catch and log use an email service.

**Queries (pg-promise examples)**
- Create user:
```js
const q = 'INSERT INTO users (email, password_hash, is_verified) VALUES ($1, $2, $3) RETURNING *'
db.one(q, [email, passwordHash, false])
```

- Find user by email:
```js
const q = 'SELECT id, email, password_hash, is_verified FROM users WHERE lower(email) = lower($1)'
db.oneOrNone(q, [email])
```


**Rate limiting & security**
- Login/register/resend-otp: stricter limits e.g., 5 attempts / 15 minutes per IP+email.
- Use Redis to track attempt counters and block suspicious IPs.
- Ensure `SameSite=Strict` for refresh cookie; if supporting subdomains, set cookie domain carefully.
- Invalidate sessions on password reset and optionally on suspicious login (email notification).

**Testing checklist (minimal)**
- Unit tests for `authService` (login, register, refresh rotation, logout)
- Integration tests (Supertest) for complete flows: register→verify→login→refresh→logout
- Brute-force tests to ensure rate limiting triggers

**Operational notes**
- Log auth events (login success/fail, refresh, revoke) to facilitate audits.
- Retain refresh token records for 30 days after expiry for audit, or purge per privacy rules.

---

End of authentication plan.
