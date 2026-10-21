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

## Current Release – Phase 1 (candidate onboarding only)
- Gate in `js/config.js`; employer side built but disabled (`employerEnabled:false`).
- Landing (brand carousel, Candidate/Employer cards; "Latest jobs" removed) → Register (3-step bar: Register / Create Resume / Finish) → Verify mobile + email (demo OTP `123456`, "Fill demo code") → 7-step bar: Details (photo, optional resume upload, Fresher/Experienced) → Education → Experience → More about you → AI resume → Template → Ready → Done.
- Fresher skips the Experience step; Education and Experience have "Skip for now"; end date cannot precede start date.
- Division/Segment is a fixed dropdown. Each experience card has a CTC field (currency dropdown INR/USD/EUR/GBP/AED/SGD + amount; stored privately, not shown on the resume). The "I currently work here" toggle appears only on the first (current) employer card; "Previous Employer" cards don't have it. Google/LinkedIn buttons are demo-only (toast on click).
- Progress is saved as a draft and resumed on next login. Mobile-first (16px inputs, 40px+ tap targets).
- Resume upload stores only the file name (no parsing).

- **Section layout (client obs):** every 'More about you' section follows Title -> input -> suggestions -> added list.
- **Awards & Certifications** now capture Month + Year (stored as {name, month, year}); shown on resume and summary as 'Name (Mar 2024)'.

- **Download PDF (client obs):** removed from the footer button row; now sits inside the resume section (under the resume preview on the Ready step, and in the Your resume block on the done page). Also shown on the candidate /app/resume page (hidden until the full candidate area is enabled).

- **Forgot Password (client obs):** 4-state page at #/forgot-password (js/forgot.js): Initiate (email/mobile) -> Verify (6-digit OTP, resend timer, demo code 123456) -> Reset (show/hide, strength bar, 4 rules) -> Success -> Go to Login. FAQ & Support links below. Updates the demo password for a matching email/mobile. Old /reset-password link redirects here.

- **Client obs batch (register/details/education):** flag next to country code (inline SVG, changes with selection); Google/LinkedIn brand logos on register buttons; DOB (date picker, required) + auto-calculated read-only Age on Details (stored as profile.dob); Education: 'Degree / Diploma' + Institute, 'Currently Studying' moved to top of the card, red delete icon, '← Back' on step Back button. Experience: current-only toggle + CTC were already done earlier (client tested an old build).

- **Mobile QA pass:** audited all screens at 360 and 390px (no horizontal overflow, no JS errors). Global rule: every input/select/textarea is 16px on mobile (no iOS zoom); .btn-sm min-height 40px; link-buttons and chip x get larger tap areas.

- **Download PDF placement (update):** now in a "Your resume" header row (`.rs-head`: title left, Download PDF right) above the resume on the Ready step, done page and /app/resume.

- **Client mobile reference (image: `reference/client-mobile-wireframe.png`)** - client's mobile wireframe of the full Phase 1 flow; use as the visual target for mobile. Key details:
  - Landing: pharmalinkin.com logo + "Already have an account? Sign in" on top; "Trusted by top companies" pill with a brand carousel (Cipla, Novartis, GSK, Pfizer, Sun Pharma, arrows); "Your Next Career Move / Starts Here" heading; Candidate and Employer cards SIDE BY SIDE (illustration, text, Register as Candidate (blue) / Register as Employer (outline)); 4 feature icons in one row (Verified Jobs, Trusted Companies, AI Powered Matching, Career Growth).
  - 7-step bar ("Step N of 7": Account, Verify, Details, Education, Experience, Resume, Finish) with check dots; centered title + subtitle per step; "<- Back" at bottom-left next to a full-width blue Continue.
  - Create account: First Name + Surname in one row; mobile with flag + India (+91) select and number side by side; Email; Password with eye and "Minimum 8 characters"; Continue; "or"; Google + LinkedIn buttons in one row with logos; Terms/Privacy line.
  - Verify: Mobile card (Edit) + 6 OTP boxes + "Resend in 00:25"; Email card (Edit) + 6 OTP boxes; "Verify & Continue".
  - Details: dashed photo box (avatar, Take a Photo / Upload, Skip for now); current role select; Current Location with pin icon.
  - Education: "+ Add Education"; compact cards (degree + "Currently Studying" checkbox top-right, red delete icon, institute, Start/End Year selects, CGPA/Percentage); "+ Add Another Education"; green-ish tip "Students can skip. You can always update later!".
  - Experience: "Present Employer (Current)" with "I currently work here" toggle; Company, Job Title, Start Date / End Date (Present), Description; "+ Add Experience"; tip "Freshers can skip...".
  - More about you: tabs Skills/Awards/Certifications/Languages/Projects; skill input + blue Add; "Popular:" chips; "Your Skills" chips with x; "Awards & Achievements (Optional)" + "Add Award"; tip "You can always update these later".
  - AI resume: "Create your resume with AI" + AI Powered badge; focus checkboxes (Education, Skills, Experience, Projects, Awards); tone pills (Professional, Modern, Concise); "Next: Choose Template".
  - Template: 4 thumbnails (Modern, Professional, Creative, Classic) + "More templates"; "Your resume will include" icon grid; "Create My Resume".
  - Ready: "Your resume is ready!" + "Edit with AI"; resume preview; Download PDF + Save to Profile side by side; "Looks good? You can customize it anytime."
  - Note: this wireframe shows older layouts in places (e.g. "Popular:" label, Download PDF beside Save to Profile); the later written observations (Download PDF inside Resume section, dated awards, DOB/Age, CTC, etc.) take precedence.

- **Finish page = Dashboard (client obs):** Download PDF stays on the Ready step right after the resume is created. The finish page (`/onboarding/done`) is now titled "Dashboard": welcome, 4 stat tiles (profile strength, skills, education, experience), profile summary, and the resume with its Download PDF button. Fresher skipping Experience was already working.
- **Experience fields mandatory (client obs):** in each experience card all fields (company, title, division, CTC currency+amount, start, end unless current) are required; only description is optional. Fully empty cards are treated as skipped.


- **Education/Upload/Skip changes (client obs):** "(Optional)" removed from Upload resume; "Skip for now" removed from Education and Experience (Experienced users must add at least one job; Fresher still auto-skips Experience). Education is now four fixed cards: 10th, 12th, Graduation, Post Graduation, each with its own "Currently pursuing this education" checkbox. Passing Year is year-only (no start year/month). Board (10th/12th) and Stream (12th) optional; 10th/12th/Graduation need school/institute + passing year (+ degree for Graduation) unless pursuing; Post Graduation fully optional but must be complete if started. Stored as profile.education entries with `level`, `board`, `stream`. Excel export (CSV w/ BOM) has separate columns per qualification: `PL.onb.exportRows`; button "Export to Excel" on the Dashboard (own data) and "Export candidates (Excel)" on admin Reports (hidden in Phase 1).

## Forgot Username + Jobs module (latest batch)
- **Forgot Username** (`#/forgot-username`, `js/forgot.js`, `st.mode='un'`): first name + registered mobile -> OTP (demo 123456) -> choose Email or WhatsApp (masked) -> generic "Username Sent" message. Demo-only line shows the real username (remove in production). Linked from login ("Forgot username?").
- **Jobs (Naukri-style, `js/jobs.js` + `css/jobs.css`)**: routes `/job-search` (hero search: keywords + experience + location, suggestions, popular chips, recommended, top companies, browse by function/location), `/job-results?...` (filters in URL: work mode, experience slider, department, salary, location, freshness, role category, education, industry; applied-filter chips, sort, pagination, mobile filter drawer), `/job/:id` (detail, Apply/Save, similar jobs). Apply is a demo (stored in `profile.applied`).
- After finishing onboarding the candidate is redirected to `/job-search`; header shows Jobs / Dashboard. Dashboard has a "Find jobs" button. `config.js` allowlist includes the new routes.

## Jobs UI redesign (Naukri-style, client screenshots)
- New `jobs` layout (`PL.jobsLayout` in `js/jobs.js`, hooked in `app.js`): sticky header (logo, Home/Jobs/Dashboard, search pill, PRO pill, bell, avatar). Clicking the search pill opens a full-width search overlay (keyword / experience / location + Search, suggestions, Esc/scrim closes).
- `/job-search` = "My home": 3 columns - profile card with completion ring + profile performance + side nav; PRO banner, Recommended tabs (Applies/Profile/You might like/Preferences) with scrolling cards, Early access roles; right promo + safety cards.
- `/job-results`: filters left, results centre ("1 - 6 of N <query> jobs", Send me jobs like these, Sort by), Naukri-style cards (rating, exp | location | salary, description, skills dots, Save), PRO promo right. Mobile: filter drawer.
- `/premium`: "Elevate your career" Pro page with What-you-will-get table (demo; Get Pro shows a toast). Allowed in `config.js`.
- Ratings/reviews on cards are generated demo values.

## Update: Education + role validation
- Education now has 5 cards: 10th, 12th, Graduation, Post Graduation (optional), Diploma / Certification Course (optional); separate Excel columns for each.
- 'Currently pursuing' is exclusive across education cards (checking one unchecks the others).
- Role (Fresher/Experienced) shows inline red validation + toast if unselected (native 'required' removed since the radios are hidden).

## Update: Resume cleanup
- Removed 'Download PDF' (resume header + dashboard resume card) and 'Edit with AI' button from the resume step. After 'Save to Profile' the candidate lands on /job-search.

## Update: Pro removed
- Client: no Pro. Removed header PRO pill, Pro banner on My home, 'Upto 3X boost' button, Pro promo on results, and the /premium page (and its allowlist entry).

## Update: Dashboard revealed
- New candidate Dashboard at #/dashboard (jobs layout, js/jobs.js, allowlisted): KPIs (Applications, Saved jobs, Profile strength, Skills), Recent applications, Saved jobs, Recommended, profile-strength card (Edit my answers). Header Dashboard link / avatar menu / My home card point to it. #/onboarding/done remains the resume/profile summary ('My resume' button).
- Flow verified: onboarding finish -> #/job-search -> Dashboard.

## Update: Job actions + contact details
- Job cards (results) and Dashboard job rows now have Share (copies job link), Save, View job. Job detail has Share + Save + Apply and a 'Contact details' card (recruiter name, email as mailto, phone as tel; demo data from the job's recruiter user).

## Update: Onboarding autosave
- Draft is now autosaved on every input/change (and tag add/remove, card add/delete) in onboarding.js, not only on Next, so re-login resumes with all typed data (education etc.) and the current step.

## Update: stale 'currently pursuing' on restore
- When a saved draft/profile has several education cards marked current (old data), only the first stays current on load; the others are unchecked and their Passing Year re-enabled.


### Education and Experience validation update
- Education cards are renamed High School (10th) and Intermediate (12th). The keys stay 10th and 12th.
- Board is now mandatory on every card that has a Board field.
- The grade label is 'CGPA / %' for degree cards and 'Percentage / %' for school cards. Edu cards stack to one column at 480px or narrower.
- School cards list years from the current year downward.
- Validation messages name the exact missing field.
- Fresher skips all experience validation on the final submit, so hidden experience cards no longer trigger year prompts.
- The CSV export headers use the new card titles.


### Job share
- Share on job cards, dashboard rows and job detail opens a 'Share this job' modal (action jb-share in jobs.js) with WhatsApp, Facebook, X, LinkedIn and Email icons plus Copy link.

- Removed 'Skip for now' from the Add photo block on the Details step.

- Fixed: share-modal classes renamed .jb-shr* because .jb-sh is the section-heading class (it broke 'Recommended jobs for you' on mobile).

### Job module logic fixes
- Apply opens a confirm modal (resume, contact, experience-mismatch and low-profile warnings). Applications can be withdrawn.
- Guests see Save; Save/Apply as a guest resumes automatically after sign-in (sessionStorage pl_jb_pending, handled in /job/:id).
- Contact details on the job page require sign-in.
- Search: location words match in the keyword box, abbreviations (MR, QA, QC, RA, PV, HR...) expand, short words match whole words only.
- New pages: #/my-applications (status stepper Applied > Viewed > Shortlisted > Interview, simulated in demo) and #/saved-jobs; dashboard KPIs and View all link to them.
- Back link returns to the page the job was opened from (PL.state.jbFrom).
- Applicants count includes the user's own application; Preferences tab uses saved preferences; recommendations boost preferred locations; 'Send me jobs like these' saves an alert in profile.alerts.
- Mobile audit at 360px and 390px across all phase-1 screens: no horizontal overflow.

### Demo candidate
- Demo candidate u1 is now Mohit Bhati (email stays u1@demo.pharmalinkin.example) and is seeded as already onboarded (level, DOB, 10th/12th/Graduation, resume), so sign-in goes straight to #/job-search. Old saved browser data is migrated automatically on load. To test onboarding, register a new account.
