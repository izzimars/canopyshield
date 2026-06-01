# CanopyShield
Open-source environmental risk management and community engagement platform for schools.

## The Problem

Over 1 billion children live in high climate-risk zones, yet schools — where children spend most of their waking hours — have no systematic, real-time environmental risk monitoring. In Nigeria, classes of 50+ children share unventilated rooms with no cooling, surrounded by buildings, and exposed daily to dangerous heat stress and poor air quality. No government mechanism monitors or responds to this.

## Current System

CanopyShield already has the backend foundation for school-level environmental monitoring and community engagement.

- 🌡️ Pulls live temperature, humidity, and AQI data every 30 minutes per school
- 📊 Generates composite Environmental Risk Scores with historical trend analysis
- 🔔 Pushes real-time alerts to parents when risk thresholds are breached
- 🎮 Gamifies community action — parents earn points via quizzes and alerts
- 🌳 Tracks tree crowdfunding and tree planting per school
- 🏆 Maintains school risk and tree leaderboards
- 🔐 Supports user authentication, OTP verification, and admin-only school request management

## What We Want To Achieve Next

The next product step is to make the school-to-donation flow more trusted and visible.

- Verify whether a person is genuinely linked to a school before granting school access
- Support a controlled admin registration or approval flow for schools
- Let schools create tree requests that are visible to users
- Allow users to see which school is requesting support and choose where to donate
- Turn the current backend into a transparent school-funded tree planting marketplace

## Tech Stack

- **Backend**: Express.js (TypeScript)
- **Database**: PostgreSQL + db-migrate
- **Scheduling**: node-cron (risk updates every 30 min)
- **External API**: OpenWeatherMap (temperature, humidity, AQI)
- **Auth**: JWT tokens
- **Testing**: Mocha + Chai + Supertest + Sinon
- **Notifications**: Web Push (VAPID)

## Architecture
School → Weather API → Risk Scoring Engine → Snapshot Storage
→ Push Notifications → Gamification (points, badges, trees) → Trend Analysis

## Roadmap

- [x] Backend architecture and core modules
- [x] Real-time risk scoring engine
- [x] Push notification system
- [x] Gamification and badge engine
- [x] Tree crowdfunding and school donation tracking
- [ ] School-linked identity verification
- [ ] Admin onboarding / approval flow
- [ ] Public tree request feed for schools
- [ ] Frontend web map (in development)
- [ ] 3 Lagos pilot school deployments
- [ ] Predictive AI for climate-health outbreak risk
- [ ] Blockchain logging of environmental data
- [ ] IoT sensor integration for 100+ schools

## License

MIT License — see [LICENSE](LICENSE) for details.

## Built For

UNICEF Venture Fund Climate Ventures Cohort 2026 — frontier tech solutions at the intersection of climate and children's health.

## Contact

Founded by Macaulay Israels — Lagos, Nigeria