# PharmaLinkIn – Interactive HTML Prototype

A multi-screen, clickable prototype of a pharma professional network and recruitment platform. Plain HTML/CSS/JS, no build step, no backend.

> **Prototype only.** All people, companies, jobs and ads are fictional. Data lives in your browser's LocalStorage, which is **not** a secure database. Passwords are fake demo values and weakly hashed. Payments, email and file uploads are simulated.

## Phase 1 – Candidate onboarding only
`js/config.js` sets `phase: 'onboarding'`. Only these screens are reachable: landing, register (candidate), verify, onboarding (5 steps with progress bar), onboarding summary, login, forgot/reset password, info pages. Every other route redirects to `/`. All other modules stay in the code; set `phase: 'full'` in `js/config.js` to re-enable everything.

## Deploy on GitHub Pages
1. Put the folder contents (with `index.html` at the repo root and the `.nojekyll` file) in the repo.
2. Repo **Settings → Pages → Deploy from a branch → main / (root)**.
3. Open `https://<user-or-org>.github.io/<repo>/`. Hash routing needs no server config.

## Run

- Open `index.html` directly (works from `file://`), **or** serve the folder: `npx serve .` / `node` static server.
- Use **Reset demo data** (footer or profile menu) to restore the seed data.

## Demo logins (password `Demo@123`)

| Role | Email |
|---|---|
| Candidate | `u1@demo.pharmalinkin.example` |
| Recruiter | `r1@demo.pharmalinkin.example` |
| Advertiser | `a1@demo.pharmalinkin.example` |
| Super admin | `admin@demo.pharmalinkin.example` |

## Routes (hash router, `#/path`)

- **Public:** `/`, `/jobs`, `/jobs/:id`, `/companies`, `/companies/:id`, `/news`, `/news/:id`, `/pricing`, `/page/:slug`, auth pages (`/login`, `/register`, …)
- **Candidate / network (`/app/*`):** `feed`, `dashboard`, `profile[/:id]`, `resume`, `jobs[/:id[/apply]]`, `applications[/:id]`, `saved-jobs`, `job-alerts`, `network`, `messages`, `notifications`, `search`, `settings`
- **Recruiter (`/employer/*`):** `dashboard`, `company`, `jobs`, `jobs/new`, `jobs/:id/edit`, `applicants[/:id]`, `candidates`, `interviews`, `messages`, `notifications`, `subscription`; checkout at `/pricing/checkout/:plan`
- **Advertiser (`/advertiser/*`):** `dashboard`, `campaigns`, `campaigns/new`, `campaigns/:id[/edit]`, `analytics`, `notifications`
- **Admin (`/admin/*`):** `dashboard`, `users`, `companies`, `jobs`, `moderation`, `advertisements`, `subscriptions`, `reports`, `settings`, `audit-logs`, `notifications`

## Architecture

- `js/data.js` – seed data, LocalStorage store (`PL.store`), query helpers (`PL.q`)
- `js/ui.js` – UI kit, forms/validation, modals, charts, event delegation (`PL.act`, `PL.form`)
- `js/router.js`, `js/auth.js` – routing with role guards, session, auth screens
- `js/app.js` – layouts, search, settings, static pages, bootstrap
- `js/public.js`, `candidate.js`, `feed.js`, `messaging.js`, `recruiter.js`, `advertisements.js`, `admin.js` – feature areas
- `css/styles.css`, `css/responsive.css`

## Simulated behaviour

- Checkout: any card works; `4000000000000002` simulates a decline.
- Moderation is on by default: new jobs become *Pending Approval* until an admin approves (toggle in Admin → Settings).
- Ads: CPM ₹0.35 / CPC ₹12 simulated; impressions counted once per campaign per page load; ads are labelled "Sponsored".
- Plan limits (active jobs, featured jobs, contact unlocks) are enforced for recruiters.
- Images are capped at 250 KB; resumes store only file metadata.

## QA checklist

1. Register/sign in per role; guarded routes redirect.
2. Candidate: search jobs, save, apply (4 steps), withdraw, build profile, connect, message.
3. Recruiter: post job → admin approves → appears publicly; change applicant status; schedule interview; unlock contact.
4. Advertiser: create campaign → admin approves/rejects → sponsored placements and analytics update.
5. Admin: verify company, moderate reports, suspend user, review audit log.
6. Check layouts at ~1100, 860 and 720 px widths; keyboard navigation and focus.
