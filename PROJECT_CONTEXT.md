# PharmaLinkIn – Project Context

Interactive frontend prototype for a pharmaceutical professional networking and recruitment platform.
Reference site: https://www.pharmalinkin.com/ (currently WordPress; the new app is planned from scratch).
Scope: **frontend prototype only** – no backend, API keys, database, build step, or paid services.

## Role / Persona
Act as senior UI/UX designer, product architect and frontend engineer. Deliver a connected, multi-screen, stakeholder-demo-ready app – not a static landing page.

## Product Concept
- LinkedIn-style networking and activity feed
- Pharma-specific job marketplace
- Candidate profiles and resume management
- Recruiter/employer dashboards, job posting, applicant tracking
- Sponsored ads and employer promotions
- Company pages and connections
- Separate advertiser workspace
- Full super-admin dashboard

## Tech Requirements
- HTML5, CSS3, Vanilla JS, Lucide icons (or similar), LocalStorage persistence
- CSS Grid + Flexbox, responsive (desktop-first; tablet + mobile)
- Runs via opening `index.html` or VS Code Live Server
- Client-side router (readable URLs where practical, back/forward, refresh-safe where possible)

Suggested structure:
```
pharmalinkin-prototype/
  index.html
  css/ styles.css, responsive.css
  js/ app.js, router.js, data.js, auth.js, candidate.js, recruiter.js, advertisements.js, admin.js
  assets/ logo.svg, images/
  README.md
```

## Design Direction
- Primary `#155EEF`, secondary teal `#0D9488`, background `#F5F7FA`, white surfaces
- Inter (or similar clean sans-serif); rounded cards, subtle borders, restrained shadows
- Premium, modern healthcare-tech / recruitment SaaS feel
- Avoid: WordPress-theme look, heavy gradients, huge empty heroes, overcrowded dashboards, excess animation, lorem ipsum, broken images, dead buttons, identical-looking screens
- Realistic pharma content, Indian salary formats; mark all data as **demo content** and never imply companies/jobs are verified

## App Shell
- Authenticated top nav: logo, Feed, Jobs, My Network, Messages, Notifications, Search, Profile menu, role-specific primary action
- Desktop feed: 3 columns (left profile/completion/quick links · center composer+feed+sponsored · right suggestions/jobs/ads/news)
- Mobile: compact header + bottom nav
- Recruiter/Admin: sidebar + main content, collapsible on mobile; admin visually distinct

## Roles
Candidate · Recruiter/Employer · Advertiser · Super-admin (never available via public registration)

## Screens

### Public
Homepage (hero, search, categories, featured jobs/companies, news, sponsored preview, CTAs, plans preview, footer) · Job search (filters: department, experience, qualification, salary, type, work mode, date; sort; save/view/apply; pagination; empty states) · Job details (apply/save/share/report, related jobs) · Company directory + profile (follow, jobs, posts, privacy-safe recruiter contact) · Industry news (categories, search, bookmark, editorial vs sponsored) · Pricing (Free/Growth/Professional/Enterprise; sample prices clearly labeled; checkout preview only)

Job categories: Medical Representative, Pharmaceutical Sales, Area/Regional/Zonal/National Sales Manager, Product Management, Medical Affairs, Regulatory Affairs, QA, QC, Pharmacovigilance, Clinical Research, Manufacturing, Production, R&D, Hospital Pharmacy, Retail Pharmacy, Distribution, Supply Chain, Medical Devices.

### Auth
Login (show/hide password, remember me, forgot, demo-only social buttons, validation) · Registration with role selector (Candidate / Recruiter / Advertiser) and role-specific forms, duplicate-email check · Email verification, success, forgot/reset password, registration complete (all simulated – state that no real email/OTP is sent) · Role-based redirect · Demo credentials / role access panel

### Candidate
Overview (stats, recommended jobs, activity) · Profile (avatar, cover, headline, about, education, experience, skills, certifications, languages, preferences, privacy; local edit/save) · Resume management (simulated upload; no server) · Application workflow (auth check, preserve job on login redirect, form, review step, validation, reference number, duplicate prevention) · My applications (statuses: Applied, Under Review, Shortlisted, Interview Scheduled, Offer, Hired, Rejected, Withdrawn; withdraw with confirm) · Saved jobs + alerts · My Network (suggestions, connect/withdraw, accept/ignore) · Messages + notifications

### Networking Feed
Composer (text, topic, simulated image, hashtags, preview) · Post cards (like, comment, share, save, follow, report, delete own with confirm) · Tabs: For You, Following, Jobs, Industry News · Deterministic demo ranking (no real algorithm claims)

### Advertising
Placements: sponsored feed posts, sponsored jobs, featured company cards, sidebar ads, newsletter promo, webinars/events, courses, hiring campaigns, sponsored search results. Clearly labeled "Sponsored"; ~1 ad per 4 organic posts; no consecutive duplicates; Hide Ad / Report Ad; no unsupported medical claims.
Advertiser dashboard: overview, create campaign, list, detail, creative preview, targeting, placement, budget/duration, status (Draft, Pending Approval, Active, Paused, Rejected, Completed), edit/pause/resume/end, analytics (impressions, clicks, CTR, spend, remaining budget, conversions – derived consistently, labeled simulated).

### Recruiter / Employer
Overview (KPIs, recent applicants, chart, quick actions) · Company profile management · 6-step Post Job wizard (basics → location → requirements → compensation → description → promotion/review; Back/Next/Save Draft/Cancel/Publish; validation keeps values; moderation → Pending Approval) · Manage jobs (search, view/edit/duplicate/pause/close/delete draft/applicants, confirmations) · Applicant management (filters, profile, resume preview, shortlist, reject, stage moves, notes, schedule, message, simulated CSV) · Interview scheduling (form, calendar/list, edit/cancel → candidate notification) · Candidate discovery (plan-based contact/resume restrictions) · Subscription management (simulated payment)

### Super-Admin
Overview KPIs + charts + date filters · User management (search, filters, suspend/reactivate/ban, roles) · Employer verification queue (approve/reject with reason, audit) · Job moderation (pending/published/rejected/expired, reported) · Content moderation (posts, comments, jobs, users; resolve/dismiss/remove; history) · Ad management (approve/reject/pause/end; updates advertiser status and feed eligibility) · Subscriptions/billing (simulated invoices) · Reports & settings (growth, jobs, conversion, employers, ads, subscriptions, categories, notification templates, site settings, audit logs)

### Messaging & Notifications
Shared module: conversation list/search/detail, composer, unread counts, empty state. Notifications for connections, application status, interviews, recruiter messages, job approvals, verification, campaign approvals, moderation – each navigates to the relevant screen.

## Shared Components
Header, sidebar, bottom nav, buttons, inputs, selects, validation, job/company/profile cards, feed & sponsored posts, status badges, data tables, tabs, dropdowns, modals, toasts, empty states, confirm dialogs, pagination, search/filter bars, loading/error states.

## Demo Data Model (stable IDs, consistent relations)
Users, Jobs, Applications, Companies, Posts, Connections, Messages, Notifications, Campaigns, Subscriptions, Reports, Audit logs (fields as in the original brief).

## State & Persistence
- Shared state layer; seed deterministic demo data on first launch
- Persist to LocalStorage; don't overwrite user changes on reload; handle invalid stored data
- "Reset Demo Data" option
- README must state LocalStorage is not a secure production DB; no real passwords/candidate data

## Routes
- Public: `/ /jobs /jobs/:id /companies /companies/:id /news /news/:id /pricing /login /register /forgot-password /verify-account`
- Candidate: `/app/feed /app/profile /app/jobs /app/jobs/:id /app/applications /app/saved-jobs /app/job-alerts /app/network /app/messages /app/notifications /app/settings`
- Employer: `/employer/dashboard /company /jobs /jobs/new /jobs/:id/edit /applicants /candidates /interviews /subscription /messages`
- Advertiser: `/advertiser/dashboard /campaigns /campaigns/new /campaigns/:id /analytics`
- Admin: `/admin/dashboard /users /companies /jobs /moderation /advertisements /subscriptions /reports /settings /audit-logs`

Cross-role updates required: application submit → candidate lists; job publish → employer manage + admin moderation; admin approval → public listing; campaign approval → advertiser status + feed eligibility; recruiter status change → candidate dashboard; interview scheduling → candidate notification.

## Acceptance Criteria
Every visible control works or is clearly disabled; destructive actions confirm; toasts on success; transparent simulation for email/SMS/payments/uploads/social login.

## Accessibility & Responsiveness
Semantic HTML, labelled controls, keyboard nav, visible focus, accessible dialogs, alt text, contrast, reduced-motion, no horizontal overflow, mobile layouts for tables/dashboards.

## Development Phases
1. Structure, tokens, nav, routing
2. Public home, job search/detail, login, registration
3. Candidate profile, feed, applications, saved jobs, networking
4. Employer dashboard, job creation, applicants, interviews
5. Advertising + advertiser dashboard
6. Super-admin + moderation
7. Shared state, persistence, cross-role updates
8. Responsive, accessibility, validation, error handling
9. End-to-end testing

## Test Scenarios
A Candidate journey · B Recruiter journey · C Admin job approval · D Recruitment (shortlist → interview → notification) · E Networking · F Advertising approval → feed · G Moderation · H Persistence + reset · I Responsive (home, job detail, feed, apply form, employer, advertiser, admin tables)

## Deliverables
Working source, polished prototype, README (setup, demo logins per role, route/screen inventory, simulated integrations & limitations, manual QA checklist, architecture/state explanation).

## Status
- Full prototype built (public, candidate, feed, recruiter, advertiser, admin, messaging). See `README.md` for routes, demo logins and the QA checklist.
