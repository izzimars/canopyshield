Created memory file [](file:///Users/enyata/Library/Application%20Support/Code/User/workspaceStorage/c409d78cc6fc4360cfb7a371a8bbbdba/GitHub.copilot-chat/memory-tool/memories/MDQ0NzM1ZjQtYjBlMS00MWU5LWI2MGMtOGYxYzk5YWIyYjQ5/canopyshield-plan.md)

I'll create a comprehensive development plan for CanopyShield. Since there's a disk space issue, I'll present it directly:

---

# **CANOPYSHIELD DEVELOPMENT PLAN**

## **1. CORE PILLARS**
1. Climate data pipeline (real-time weather/AQI + scoring)
2. Engagement system (points, badges, tree-planting gamification)
3. Public data API (unauthenticated UNICEF transparency)
4. User platform (auth, profiles, alerts, push)
5. Admin console (school management, tree verification, analytics)

---

## **2. DEVELOPMENT PHASES (14 weeks total)**

### **PHASE 0: Setup & Infrastructure (Weeks 1–2)**
**Owner:** DevOps Lead

**Deliverables:**
- Git repo + branching strategy (main, develop, feature/*)
- PostgreSQL schema (Prisma, all 11 tables)
- Redis setup (caching, sessions, rate limiting)
- Environment files (.env) for dev/staging/prod
- Docker Compose stack (local dev)
- Winston logging infrastructure
- GitHub Actions CI/CD skeleton

**Milestones:**
- [ ] Local dev environment works (docker-compose up)
- [ ] Migrations runnable from clean DB
- [ ] CI pipeline runs linting on PR

---

### **PHASE 1: Core Backend API (Weeks 3–6)**
**Owner:** Backend Lead + Backend Dev 1

**1A: Database Layer**
- [ ] Prisma schema for 11 tables
- [ ] Seed scripts (3 pilot schools)
- [ ] Indexes optimized (schools by risk, trees by date)
- [ ] Postgres trigger for 100-point tree threshold

**1B: Authentication Endpoints**
```
POST /api/v1/auth/register       → Email verification
POST /api/v1/auth/login          → Access + refresh tokens
POST /api/v1/auth/refresh        → Token rotation
POST /api/v1/auth/logout         → Revoke tokens
POST /api/v1/auth/forgot-password → send token 
POST /api/v1/auth/resend-otp
POST /api/v1/auth/reset-password
GET  /api/v1/auth/verify-otp  → Email confirmation

```
- [ ] Zod validation on all inputs
- [ ] Bcrypt hashing (cost 12)
- [ ] Rate limiting: 10 req/min
- [ ] JWT signing (HS256)

**1C: Public API (No Auth Required)**
```
GET /api/v1/schools                    → All schools + risk scores (cached 5 min)
GET /api/v1/schools/:id/risk           → Latest + last 5 readings
GET /api/v1/schools/:id/risk/history   → Time-series (7 days default)
GET /api/v1/schools/:id/prediction     → 24-hour forecast (rule-based → ML later)
GET /api/v1/leaderboard/risk           → Schools ranked by score
GET /api/v1/leaderboard/trees          → Schools ranked by trees
GET /api/v1/schools/:id/trees          → Planting history + photos
```
- [ ] Response schemas locked (stable for ML swap)
- [ ] All GETs cached in Redis
- [ ] Rate limiting: 60 req/min per IP
- [ ] CORS: allow * origin (public data)

**1D: OpenWeatherMap Integration**
- [ ] Wrapper service (current + 5-day forecast)
- [ ] Risk scoring engine:
  - Heat score: feels-like (50%) + UV normalized (30%) + humidity (20%)
  - AQI score: WHO breakpoints → 0–100
  - Combined: max(heat, AQI) × 0.6 + min(...) × 0.4
- [ ] Redis caching (key: `weather:{schoolId}`, TTL: 25 min)
- [ ] Error handling + graceful degradation

**1E: Cron Job (Every 30 minutes)**
```javascript
node-cron.schedule('*/30 * * * *', async () => {
  for each school:
    1. Check Redis cache
    2. If miss, fetch OWM (current + 5-day)
    3. Compute risk scores
    4. INSERT risk_snapshots
    5. UPDATE schools.current_risk_score
    6. Invalidate leaderboard cache
    7. Trigger alert dispatch (→ 1F)
})
```

**1F: Alert Dispatch System**
- [ ] Query users by alert preference + threshold
- [ ] Deduplication: Redis key `alerted:{userId}:{schoolId}` (4h TTL)
- [ ] Email via Nodemailer (HTML templates)
- [ ] Web Push via web-push library (VAPID-signed)
- [ ] Logging: track success/failure

**Acceptance Criteria:**
- All endpoints respond in <200ms (p95)
- Cache hit rate >80% on public endpoints
- Risk scores match formula within 0.1%
- Alerts delivered within 2 min of threshold breach

---

### **PHASE 2: Engagement System (Weeks 7–9)**
**Owner:** Backend Dev 2

**2A: Quiz Subsystem**
```
GET  /api/v1/quiz/today       → Today's question (answer hidden)
POST /api/v1/engagement/quiz  → Submit answer
POST /api/v1/admin/quiz       → Create question (admin)
```
- [ ] Redis enforces 1 quiz per 24h (key: `quiz:{userId}:{date}`)
- [ ] Atomic transaction: validate answer → +10 pts → check 100-pt trigger
- [ ] Badge eligibility: `quiz_streak` if 7 consecutive days
- [ ] Topic tags for content variety

**2B: Alert Sharing**
```
POST /api/v1/engagement/share → Redeem share token
```
- [ ] Share token: generated when user clicks "share", single-use, 1h TTL (Redis)
- [ ] Atomic: delete token + +5 pts + check threshold
- [ ] Logging: track shares per user/school

**2C: Tree Donation**
```
POST /api/v1/engagement/donate → Submit donation event
```
- [ ] Atomic transaction: INSERT engagement_event + UPDATE school_points
- [ ] Postgres trigger fires if total ≥ 100 → INSERT tree_request
- [ ] Node listens on NOTIFY → send partner email + push to all school users

**2D: Badge System**
- Badge types: `tree_planter`, `quiz_streak`, `alert_hero`
- [ ] Eligibility logic per badge
- [ ] Tree confirmation (admin) triggers batch badge issuance
- [ ] Web Push notification on award

**2E: User Profile & Preferences**
```
GET /api/v1/users/me           → Profile, points, badges, alert prefs
PUT /api/v1/users/me/alerts    → Update threshold, channels, frequency
```

**Acceptance Criteria:**
- Points credited in <500ms (transactional)
- 100-point threshold triggers within 1 min
- No duplicate badges awarded
- All engagement events logged for audit trail

---

### **PHASE 3: Push Notifications (Week 10)**
**Owner:** Backend Dev 2

**3A: Web Push Infrastructure**
- [ ] VAPID key pair generated (once, env-stored)
- [ ] Endpoint: `POST /api/v1/push/subscribe` (save endpoint + p256dh + auth)
- [ ] web-push library integration
- [ ] VAPID headers signed by server

**3B: Notification Triggers**
| Event | Email | Push |
|-------|-------|------|
| Risk exceeds threshold | ✓ | ✓ |
| Daily digest (7am) | ✓ | — |
| Tree incoming (100 pts) | ✓ | ✓ |
| Tree confirmed | ✓ | ✓ |
| Badge awarded | — | ✓ |
| Quiz reminder | — | ✓ (daily) |

**Acceptance Criteria:**
- Push delivery verified on Chrome, Firefox, Safari
- Retry logic for failed deliveries
- No duplicate notifications from deduplication

---

### **PHASE 4: Admin Console Backend (Week 11)**
**Owner:** Backend Lead

**4A: School Management**
```
POST   /api/v1/admin/schools      → Create school, trigger first OWM fetch
PUT    /api/v1/admin/schools/:id  → Update school details
DELETE /api/v1/admin/schools/:id  → Soft delete (MVP)
```

**4B: Tree Planting Workflow**
```
POST /api/v1/admin/trees/confirm  → Verify planting, reset pool, issue badges
GET  /api/v1/admin/trees/pending  → List pending requests
```
- [ ] Transaction: lock school_points → reset to 0 → batch INSERT badges → log confirmation

**4C: Admin Stats Dashboard**
```
GET /api/v1/admin/stats
```
- Total users, DAU (7d)
- Engagement breakdown (quizzes, shares, donations)
- Point pool per school
- Total trees, last planting date
- Alert delivery rates (sent, delivered, bounced)
- OWM API error rate & latency
- Redis cache hit/miss rates

**Acceptance Criteria:**
- Tree reset atomic (no partial updates)
- Stats queries execute in <500ms
- All admin actions logged (user, action, timestamp)

---

### **PHASE 5: Frontend (React / Next.js) — Parallel Track (Weeks 5–12)**
**Owner:** Frontend Lead + Frontend Dev

**5A: Core Pages**
- [ ] Live school map (Leaflet.js, risk overlays, animations)
- [ ] School detail view (risk chart, trees, stats, photos)
- [ ] Leaderboards (risk, trees, interactive)
- [ ] User dashboard (points, badges, engagement history)

**5B: Auth Pages**
- [ ] Register (email, password, school picker)
- [ ] Login / logout
- [ ] Email verification flow (token in URL)
- [ ] Password reset

**5C: Engagement Pages**
- [ ] Quiz modal (daily prompt, instant feedback, streak counter)
- [ ] Alert share prompt (copy link, track shares)
- [ ] Donation form (call-to-action, confirmation)
- [ ] Badge showcase (earned badges with dates)

**5D: Settings & Profile**
- [ ] Profile editor (school change, email update)
- [ ] Alert preferences (threshold slider 0–100, channels toggle, frequency select)
- [ ] Push subscription permission request
- [ ] Account deletion

**5E: PWA Setup**
- [ ] Service worker (offline caching strategy)
- [ ] App manifest (icons, theme color, display mode)
- [ ] Install prompt for mobile
- [ ] Works offline: cached map, previous scores

**Acceptance Criteria:**
- Lighthouse score >90 (performance, accessibility)
- <3s first contentful paint on 4G
- PWA installable on Android/iOS
- Responsive: mobile, tablet, desktop

---

### **PHASE 6: Testing Strategy (Weeks 8–13, concurrent)**
**Owner:** QA / All devs

**6A: Unit Tests (Jest)**
- [ ] Score formula (edge cases: 0, 100, invalid inputs)
- [ ] Badge eligibility logic
- [ ] Rate limit sliding window
- [ ] Token refresh logic
- Target: >80% coverage on business logic

**6B: Integration Tests (Supertest + test DB)**
- [ ] Auth flow (register → verify → login → refresh → logout)
- [ ] Engagement flow (quiz → points → 100-pt trigger → tree_request)
- [ ] Alert dispatch (user matches threshold → email sent → push sent)
- [ ] Cache logic (OWM miss → fetch → cache hit)

**6C: E2E Tests (Playwright)**
- [ ] User journey: register → verify email → complete quiz → share alert → earn badge
- [ ] Admin journey: add school → confirm tree → reset pool → badge issued
- [ ] Public API: fetch leaderboards, risk history, predictions

**6D: Load Tests (k6)**
- [ ] 1000 concurrent quiz submissions (same minute)
- [ ] 5000 concurrent alert broadcasts
- [ ] 60 req/min leaderboard requests

**6E: Security Tests**
- [ ] SQL injection attempts (Prisma protection validated)
- [ ] JWT token forgery
- [ ] Authorization bypass (user accessing other user's data)
- [ ] Rate limit bypass
- [ ] CORS misconfiguration

**Acceptance Criteria:**
- >80% unit test coverage
- All critical user journeys covered by E2E tests
- Load test: <500ms p95 latency at 60 req/min
- 0 security vulnerabilities from OWASP top 10

---

### **PHASE 7: DevOps & Deployment (Weeks 12–14)**
**Owner:** DevOps

**7A: CI/CD Pipeline (GitHub Actions)**
- [ ] Run linting, unit tests, build on every PR
- [ ] Auto-deploy `develop` to staging
- [ ] Manual approval gate for `main` → production
- [ ] Database migration strategy (Prisma migrate in CI)
- [ ] Blue-green deployment (zero downtime)

**7B: Docker & Containerization**
- [ ] Dockerfile (multi-stage, production-optimized, <500MB)
- [ ] docker-compose.yml (Node, Postgres, Redis, Mailhog for local dev)
- [ ] Image registry (Docker Hub or private)

**7C: Infrastructure & Hosting
- [ ] Options: Railway, DigitalOcean, AWS
- [ ] Recommendation for MVP: Railway or DO App Platform (managed DB, auto-scaling)
- [ ] Domain + HTTPS (Let's Encrypt)

**7D: Database Backups & Recovery**
- [ ] Automated daily Postgres backups
- [ ] Point-in-time recovery setup
- [ ] Backup verification (weekly restore test)

**7E: Secrets Management**
- [ ] GitHub Secrets for CI/CD
- [ ] Separate .env per environment
- [ ] Key rotation strategy

**Acceptance Criteria:**
- Deploy takes <10 min, zero downtime
- Rollback to previous version takes <5 min
- 99.5% uptime in first month
- Backup restoration tested weekly

---

### **PHASE 8: Monitoring & Observability (Ongoing)**
**Owner:** DevOps + Backend

**8A: Logging**
- [ ] Winston logger (console + file in dev, Loki in prod)
- [ ] Structured logs: timestamp, level, service, context
- [ ] Queryable log aggregation

**8B: Metrics & Alerting**
- [ ] Prometheus metrics (request latency, cache hits, OWM calls)
- [ ] Grafana dashboards (health, engagement trends)
- [ ] Alert rules (error rate >1%, cache eviction, DB conn pool saturation)

**8C: Error Tracking**
- [ ] Sentry integration (unhandled exceptions)
- [ ] Slack alerts on high-severity events

**8D: Uptime Monitoring**
- [ ] Pingdom / UptimeRobot (external health checks)
- [ ] Public status page (statuspage.io)

---

## **3. TEAM STRUCTURE (4–5 developers)**

| Role | Weeks | Responsibilities |
|------|-------|------------------|
| **Backend Lead** | 0–14 | API architecture, auth, data model, admin endpoints |
| **Backend Dev 1** | 3–14 | OWM integration, alerts, cron, risk scoring |
| **Backend Dev 2** | 7–12 | Engagement (quiz, shares, donations), badges, push |
| **Frontend Lead** | 5–14 | Next.js setup, map, auth, architecture |
| **Frontend Dev** | 8–14 | Dashboard, leaderboards, settings, PWA |
| **DevOps/QA** | 1–14 | CI/CD, Docker, testing infrastructure, monitoring |

---

## **4. CRITICAL DEPENDENCIES & RISKS**

| Dependency | Risk | Mitigation |
|------------|------|-----------|
| OpenWeatherMap API | Outage → no risk scores | Cache aggressively, fall back to stale data, manual override |
| Postgres NOTIFY | Trigger delay → tree not detected | Test pg pooling, monitor subscription count |
| Email delivery | Lost registrations/alerts | Implement queue (Bull/RabbitMQ) in v2, retry logic |
| Web Push endpoints | Deprecated → users miss alerts | Monitor delivery failures, fallback to email |
| Redis connection | Cache loss → slow API | Persistent data in Postgres, redis-sentinel for HA |
| Concurrent updates | Race conditions on points | Use transaction isolation level SERIALIZABLE |

---

## **5. SUCCESS CRITERIA (MVP Launch)**

**Data & Impact:**
- [ ] 3 pilot schools live with real-time risk scores
- [ ] 100+ parent registrations
- [ ] ≥1 school reaches 100 points, tree planted and verified
- [ ] Public API serving UNICEF data

**Performance & Reliability:**
- [ ] 99%+ uptime in month 1
- [ ] <200ms latency on public endpoints (p95)
- [ ] <500ms latency on auth/engagement endpoints
- [ ] Cache hit rate >80%

**Security:**
- [ ] Zero data exposure (PII minimized: email + school_id only)
- [ ] Full backup/recovery tested
- [ ] Penetration test passed (OWASP top 10)

**Quality:**
- [ ] >80% unit test coverage
- [ ] All critical journeys covered by E2E tests
- [ ] No unhandled exceptions (Sentry clean)

---

## **6. POST-MVP ROADMAP (Post-funding)**

- [ ] **ML Models**: Replace rule-based forecasts with Python/FastAPI predictions
- [ ] **Email Queue**: Bull or RabbitMQ for reliable delivery at scale
- [ ] **Multilingual**: i18n for Yoruba, Igbo, etc.
- [ ] **Mobile Apps**: React Native or Flutter
- [ ] **Teacher Portal**: View student engagement per class
- [ ] **Audit Logs**: Compliance tracking (NCDC integrations)
- [ ] **Tree Species Database**: Biodiversity tracking
- [ ] **Sponsor Program**: Companies sponsor trees, track impact

---

## **7. TIMELINE**

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Setup | 2 weeks | W1 | W2 |
| Backend Core (1A–1F) | 4 weeks | W3 | W6 |
| Engagement (2A–2E) | 3 weeks | W7 | W9 |
| Push Notifications | 1 week | W10 | W10 |
| Admin Console | 1 week | W11 | W11 |
| **Frontend (parallel)** | **8 weeks** | **W5** | **W12** |
| **Testing (concurrent)** | **6 weeks** | **W8** | **W13** |
| **DevOps/Deploy** | **2 weeks** | **W12** | **W14** |
| **TOTAL MVP** | **~14 weeks** | | |

---

This plan prioritizes:
✅ Unauthenticated public API first (UNICEF requirement)
✅ Reliable engagement transaction logic (atomicity critical)
✅ Caching strategy (OWM rate limit protection)
✅ Testing & security from day 1
✅ Parallel frontend development to hit 14-week target

Ready to dive into any phase in detail?