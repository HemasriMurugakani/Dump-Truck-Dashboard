# SmartBed Detection System

## 1) What This Project Is
SmartBed is a mining fleet operations dashboard focused on reducing carry-back material and improving truck bed maintenance decisions.

The app helps teams:
- Detect carry-back risk early
- Monitor truck and sensor health in real time
- Run acoustic and analytics investigations
- Manage system configuration by role
- Plan and execute predictive maintenance

This project is designed for both:
- Non-technical users (operators, site leaders, maintenance teams)
- Technical users (developers, analysts, and system integrators)

---

## 2) Non-Technical Guide (Quick Understanding)

### 2.1 Who Uses SmartBed
- Super Admin: Full control across modules and settings
- Site Manager: Site-wide oversight with controlled editing
- Fleet Operator: Fleet monitoring and truck operations
- Truck Operator: Assigned truck-focused workflow
- Maintenance Tech: Maintenance and schedule execution
- Analyst: Deep analysis and reporting workflows

### 2.2 What You Can Do
- View fleet status and alerts
- Open detailed truck diagnostics
- Analyze acoustic behavior for anomaly patterns
- Review analytics, trends, and operational KPIs
- Configure system thresholds and notifications (role dependent)
- Plan maintenance tasks with wear forecasting and workload views

### 2.3 Main Pages in Simple Terms
- Dashboard: Role landing and quick high-level status
- Fleet: See all trucks and drill down into each one
- Truck Detail: Per-truck telemetry and control context
- Acoustic: Signal and vibration analysis lab
- Analytics: KPI reports, trends, and export workflows
- Config: Sensor and alert settings with role-aware restrictions
- Maintenance: Wear map, alerts, schedule, history, and predictive insights

---

## 3) Technical Guide

## 3.1 Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth (Credentials provider)
- Recharts (visual analytics)
- Sonner (toasts)
- Lucide icons
- jsPDF (report export)

## 3.2 Project Structure
- app: Next.js routes
- components: Feature components and shared UI
- lib: Mock data, auth logic, route mapping, permissions
- store: UI state store
- types: Shared TypeScript types
- backend: Reserved workspace folder for backend-related extensions

## 3.3 Auth and Role Model
Authentication uses Credentials provider with seeded users from lib/mockData.ts.

Role permissions are enforced via:
- Protected shell wrapping route pages
- Route role checks and redirects
- In-page action-level restrictions for sensitive operations

---

## 4) Local Setup

## 4.1 Requirements
- Node.js 18+
- npm 9+
- macOS, Linux, or Windows with modern terminal

## 4.2 Install
1. Open terminal in project root
2. Run npm install

## 4.3 Run
- Development: npm run dev
- Production build: npm run build
- Production start: npm run start
- Lint: npm run lint

---

## 5) Login Credentials (Seeded Demo Users)
Source: lib/mockData.ts

Password for all users: Password123!

- super.admin@smartbed.ai | SUPER_ADMIN | site alpha
- site.manager@smartbed.ai | SITE_MANAGER | site alpha
- fleet.operator@smartbed.ai | FLEET_OPERATOR | site alpha
- truck.operator@smartbed.ai | TRUCK_OPERATOR | site alpha | assigned truck 793-11
- maintenance.tech@smartbed.ai | MAINTENANCE_TECH | site beta
- analyst@smartbed.ai | ANALYST | site gamma

---

## 6) Routes and Access Matrix

- /dashboard
  - Role-aware landing experience

- /dashboard/fleet
  - Roles: FLEET_OPERATOR, SITE_MANAGER, SUPER_ADMIN, TRUCK_OPERATOR, ANALYST

- /dashboard/truck/[truckId]
  - Route-guarded; TRUCK_OPERATOR is restricted to assigned truck

- /dashboard/acoustic
  - Role-gated and feature-rich acoustic diagnostics

- /dashboard/analytics
  - KPI and advanced reporting workflows

- /dashboard/config
  - Roles: SUPER_ADMIN, MAINTENANCE_TECH, SITE_MANAGER
  - Edit scope is role-aware (full versus limited)

- /dashboard/maintenance
  - Roles: MAINTENANCE_TECH, SUPER_ADMIN, SITE_MANAGER
  - Schedule edit actions allowed for MAINTENANCE_TECH only
  - SITE_MANAGER and SUPER_ADMIN can use read-only schedule mode unless explicitly expanded later

---

## 7) Feature Module Details

## 7.1 Config Module
- Truck selector and model-aware context
- Load-cell, acoustic, camera, vibrator settings
- Alert thresholds and recipients
- Notification channels and webhook
- Save scope: truck, model, fleet (role-conditioned)
- Calibration wizard
- Hardware topology interaction
- Edge model metrics and role-gated retraining action

## 7.2 Maintenance Module
- Three-panel layout:
  - Left: Maintenance alerts with severity filters and counts
  - Center: Bed wear visualization, trend projections, replacement projection, cost summary
  - Right: Schedule, inventory status, technician workload donut
- Maintenance history tab:
  - Filters by truck, type, date range
  - Search support
- Predictive insights panel:
  - Confidence level
  - Affected trucks
  - Recommended action
  - Dismiss interaction

---

## 8) Data and Simulation Notes

This project currently uses deterministic/semi-deterministic mock data from lib/mockData.ts and local generated values for dynamic charts.

Benefits:
- Fast local development
- Reproducible demos
- No external API dependency for core UI testing

When connecting real backend services:
- Replace mock providers in feature components
- Keep route and role guards unchanged
- Preserve type contracts from types and lib

---

## 9) Quality and Validation

Current baseline validation command sequence:
1. npm run lint
2. npm run build

These checks ensure:
- Type safety
- Route/component compile validity
- App Router build stability

---

## 10) Troubleshooting

## 10.1 Dev server chunk or hot-reload errors
Symptoms:
- Missing chunk module
- Random 500 during navigation
- CSS or fallback chunk load failures

Fix:
1. Stop dev server
2. Remove build cache folder: .next
3. Restart with npm run dev

## 10.2 Port mismatch with auth callbacks
If sign-out or auth flow is inconsistent across ports:
- Use a single consistent dev port
- Prefer localhost:3001 in this project flow when actively switching users across routes

## 10.3 Route access denied
Expected behavior can occur if role is not allowed for a route.
Check:
- Allowed roles in route page wrapper
- Redirect logic and role mapping in route guards

---

## 11) Recommended Developer Workflow

1. Pull latest changes
2. Install dependencies
3. Run lint and build first
4. Start dev server
5. Verify role-specific flows using seeded users
6. Before merging:
   - Run lint
   - Run build
   - Spot-check key routes (fleet, truck detail, acoustic, analytics, config, maintenance)

---

## 12) Security and Production Notes

For production hardening:
- Replace local auth seed data with secure identity provider
- Store secrets only in secure environment management
- Add API authorization checks server-side for every mutation
- Add auditing for config and maintenance actions
- Add rate limits and input validation for all write endpoints

---

## 13) Future Enhancements

- Integrate real telemetry ingest pipelines
- Persist maintenance task states to backend
- Add background jobs for wear forecast refresh
- Add unit and integration tests for critical role-based flows
- Add observability dashboards for auth, route redirects, and action latency

---

## 14) Current Status Summary

- Core modules are implemented and route-wired
- Role-based route and action gating is active
- Maintenance module includes predictive analytics and scheduling workflows
- Project currently builds and lints cleanly

If you are a non-technical user: open the app, sign in with your role, and start from the route that matches your workflow.

If you are a technical user: start with sections 3 through 11 and use the seeded accounts to validate role behavior quickly.
