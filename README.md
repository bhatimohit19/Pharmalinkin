# PharmaLinkIn – Interactive HTML Prototype

A multi-screen, clickable prototype of a pharma professional network and recruitment platform. Plain HTML/CSS/JS, no build step, no backend.

> **Prototype only.** All people, companies, jobs and ads are fictional. Data lives in your browser's LocalStorage, which is **not** a secure database. Passwords are fake demo values and weakly hashed. Payments, email and file uploads are simulated.

## Phase 1 – Candidate onboarding + Employer workspace
`js/config.js` sets `phase: 'onboarding'`. Reachable screens: landing, account-type chooser, candidate onboarding (3-step Register / Create Resume / Finish bar on Account + Verify, then the 7-step bar from Details onward: Details → Education → Experience → More about you → AI resume → Template → Resume ready), employer registration and onboarding (create account → verify → company profile → hiring needs), employer workspace (dashboard, company profile, jobs with Publish now / Schedule / Draft, applicants, interviews), candidate profile/feed, job search/results/details, login, forgot/reset password, and info pages. The onboarding Details step includes photo selection and candidate type; it does not offer a separate resume-upload control. Employer registration/workspace is enabled with `employerEnabled: true`; other gated routes redirect to `/`. Company verification is auto-approved and plans/subscriptions are hidden in this phase. Scheduled jobs go live automatically when their time passes (checked on dashboard/jobs load – demo stand-in for a server scheduler). Set `phase: 'full'` in `js/config.js` to re-enable every role/module.

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
- **Candidate / network (`/app/*`):** `feed`, `dashboard`, `profile[/:id]`, `profile/edit`, `profile/experience[/:id]`, `profile/analytics`, `profile/completion`, `resume`, `jobs[/:id[/apply]]`, `applications[/:id]`, `saved-jobs`, `job-alerts`, `network`, `messages`, `notifications`, `search`, `settings`
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
- Images are capped at 250 KB. Legacy resume metadata may remain in LocalStorage, and application resume attachment behavior is unchanged.
- Candidate job contacts are read from local recruiter demo records; WhatsApp, Call, and Email links do not use a backend API. The mobile Social item uses Facebook, Instagram, LinkedIn, and Twitter profile links listed on the official PharmaLinkIn website.

## QA checklist

1. Register/sign in per role; guarded routes redirect.
2. Candidate: search jobs, save, apply, track/withdraw applications, build profile, connect, message.
   - An onboarded candidate signs in to the Dashboard at `/dashboard`; it focuses on applied jobs with statuses, liked jobs, resume upload/update and generated-resume download/preview, and upcoming interviews from existing LocalStorage data. Profile details, profile completion, quick links, and activity remain on their respective Profile/navigation screens to avoid duplication. Candidate Home opens My Profile; Dashboard remains a separate bottom-navigation destination. The Post destination opens the community feed and composer. Candidate account menus omit Dashboard, and candidate headers omit Messages until that header action is released.
   - My Profile follows the supplied mobile reference with profile photo/banner controls, completion, analytics, About, Experience, uploaded resume summary, Education, Skills, Interests, Activity, and recommendations. The onboarding Details step also supports a profile banner. Resume upload/update stores metadata only in this prototype; it does not retain file contents. Profile views, recruiter search appearances, and generated-resume export attempts are counted in browser-local demo analytics; viewer identities and cross-device metrics are not available.
   - Separate profile screens provide analytics, completion checklist, profile editing, experience list/add/edit, and public preview. Education, Skills, and Interests open their matching editor sections; saving returns to the corresponding profile section, validates required values, and persists to existing LocalStorage data.
   - Job-search applications use the shared Applications data used by recruiter applicant management. Existing profile-only applications are migrated into that shared list when the candidate enters job search or My applications. Uploaded resume files are represented by local metadata only and cannot be downloaded from this prototype; the generated profile resume opens a print dialog where candidates can save it as PDF. Profile completion links directly to the relevant section editor and the resume screen.
   - Mobile child screens show a browser-history Back button directly below the header only when reached from another screen in the same flow. Entry screens (including My Profile and Job Search) and directly opened pages omit it. Candidate profile **Find jobs** and **Jobs** links open the Naukri-style job-search page.
3. Recruiter: post job → admin approves → appears publicly; change applicant status; schedule interview; unlock contact.
4. Advertiser: create campaign → admin approves/rejects → sponsored placements and analytics update.
5. Admin: verify company, moderate reports, suspend user, review audit log.
6. Check layouts at ~1100, 860 and 720 px widths; keyboard navigation and focus.
