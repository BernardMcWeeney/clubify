Clubify Hub MVP Specification

A multi-tenant club platform where the club website and the mobile app share the same capabilities, with a modern marketing website that supports multiple sports (GAA ready now; others “coming soon”).

This is a new transformed specification based on your updated direction.

⸻

1) Non-negotiable product rule: simplicity first

This is the top priority and must be enforced in UX, information architecture, data model, and feature design.
	•	Super Admin (you): can see platform health and act quickly without digging.
	•	Club Admin / PRO / Treasurer / Team staff: can publish updates, manage pages, and keep the site active with minimal effort.
	•	End users/supporters: can find news, fixtures/results, sponsors, gallery, and contact info instantly.

Any feature that adds complexity must either:
	•	be hidden behind a “Coming soon / disabled” state
	•	be grouped in a “Modules” area
	•	or be deferred.

⸻

2) Products and surfaces

2.1 Marketing website (clubify.ie)

A modern, professional, responsive website showcasing what Clubify can do, with real pages (not anchor menus), and sport-specific pages/case studies.
	•	clubify.ie (Homepage)
	•	clubify.ie/pricing
	•	clubify.ie/templates
	•	clubify.ie/security (trust + governance messaging)
	•	clubify.ie/contact
	•	clubify.ie/sports/GAA (ready now)
	•	clubify.ie/sports/football (coming soon)
	•	clubify.ie/sports/rugby (coming soon)
	•	clubify.ie/sports/athletics (coming soon)
	•	clubify.ie/sports/golf (coming soon)
	•	clubify.ie/sports/tennis (coming soon)
	•	clubify.ie/sports/cycling (coming soon)

Key point: marketing pages explain the website + hub + app concept, but only GAA is live/ready.

2.2 Global onboarding and login entry
	•	clubify.ie/admin
This is the global entry for:
	•	sign up
	•	login
	•	tenant selection (if user belongs to multiple clubs)

2.3 Club tenant (public + admin)

For each club:
	•	clubslug.clubify.ie (public club site)
	•	clubslug.clubify.ie/admin (Clubify Hub for that club)

2.4 Custom domains (from day one)

Optional but supported from day one:
	•	myclub.ie (public club site)
	•	myclub.ie/admin (club hub)

Must be fully automated:
	•	domain onboarding flow
	•	SSL certificate issuance
	•	validation + status tracking
	•	no manual support required for the “happy path”

⸻

3) Sports expansion model

You are expanding the website portion to cover multiple sports, but GAA is the only sport that is actually ready to go.

3.1 Supported sports (marketing + sign-up choices)
	•	GAA (ready)
	•	Football (coming soon)
	•	Rugby (coming soon)
	•	Athletics (coming soon)
	•	Golf (coming soon)
	•	Tennis (coming soon)
	•	Cycling (coming soon)

3.2 Sport-specific templates

Each sport has 3 templates specific to that sport type.

So the template library becomes:
	•	GAA Templates: 3
	•	Football Templates: 3
	•	Rugby Templates: 3
	•	Athletics Templates: 3
	•	Golf Templates: 3
	•	Tennis Templates: 3
	•	Cycling Templates: 3

Only GAA templates are fully available initially.
For coming-soon sports, templates exist as previews/marketing assets and are selectable only if you choose to allow “early access” or “waitlist”.

3.3 Pricing

Pricing is the same across sports.
The sport selection changes:
	•	templates
	•	feature availability (feature flags per club type)
	•	onboarding defaults
…but not price.

⸻

4) Architecture and stack (high-level, no code)

You previously aligned on Cloudflare + Stripe + React + Capacitor.

4.1 Marketing site
	•	Use a modern static/SSR web framework (Astro is suitable) for clubify.ie marketing pages.
	•	Focus: performance, clarity, conversion, mobile-first.

4.2 Application surfaces (must share capabilities with the app)
	•	Use React for:
	•	clubify.ie/admin
	•	all club tenant sites clubslug.clubify.ie
	•	all club admin hubs clubslug.clubify.ie/admin
	•	Use Capacitor to package the same UI into mobile apps.
	•	Rule: Anything the club website can do must be possible in the mobile app UI.
(This heavily influences UI/IA decisions—no “desktop-only” functionality.)

4.3 Platform
	•	Cloudflare provides hosting, edge routing, multi-tenant domain handling, and background processing.
	•	Stripe Connect is part of the grand plan foundation (even if not in the first MVP slice).

⸻

5) Marketing website specification (clubify.ie)

5.1 Goals
	•	Explain Clubify clearly (Hub + Website + App)
	•	Show sport-specific pages and templates
	•	Present a professional, Stripe/ClubZap-like feel (clean typography, strong CTAs, confidence, minimal clutter)
	•	Convert: “Create your club” / “Join waitlist” depending on sport readiness

5.2 Homepage (clubify.ie) layout requirements

The homepage should:
	•	Lead with the “Clubify Hub” idea (not just website builder)
	•	Show that GAA is live now
	•	Present other sports as “coming soon” with dedicated pages and templates
	•	Be mobile-friendly, responsive, modern

Homepage sections (as actual sections, but not anchor-nav dependent):
	1.	Hero: “The Clubify Hub for modern clubs”
	•	Primary CTA: Create your club
	•	Secondary CTA: View GAA demo / templates
	2.	What it includes today:
	•	Website + app (same capability)
	•	Content + social publishing
	3.	What’s coming next:
	•	Fundraising, membership, policies/GDPR tools, etc. (present as roadmap)
	4.	Sport tiles: GAA (ready) + others (coming soon)
	5.	Templates overview
	6.	Pricing overview (link to pricing page)
	7.	Trust/governance overview (link to security page)

5.3 Sport pages (clubify.ie/sports/{sport})

Each sport page is a case study + positioning page. It must include:
	•	A clear “ready status” banner:
	•	GAA: “Available now”
	•	Others: “Coming soon” + join waitlist
	•	The 3 templates for that sport (preview cards)
	•	Sport-specific feature narrative (examples of what clubs in that sport typically need)
	•	A section “How the Hub helps” (content, comms, governance, future modules)
	•	CTA behaviour:
	•	GAA: “Create your club”
	•	Coming soon sports: “Join waitlist” or “Request early access”

Important: you must avoid promising features that aren’t actually built. Coming-soon pages can show intended direction, but should be clear about availability.

5.4 Templates page (clubify.ie/templates)
	•	Filter by sport
	•	Show 3 templates per sport
	•	GAA templates can show “live demo” links
	•	Coming-soon sports show previews and features but with “not live yet” status

5.5 Pricing page (clubify.ie/pricing)
	•	Same pricing for all sports
	•	Simple tiers (or single plan) with clearly listed included modules
	•	“Website + App + Publishing” is the MVP core
	•	Future modules listed as “included as they roll out” or “add-ons” (your choice)

⸻

6) New onboarding requirement: club type selection first

You now require the onboarding to ask the user what sport/club type they are.

6.1 New onboarding step (first screen)

After sign up/login at clubify.ie/admin, before creating the club:

Step 0: Select club type (sport)
	•	GAA (available now)
	•	Football (coming soon)
	•	Rugby (coming soon)
	•	Athletics (coming soon)
	•	Golf (coming soon)
	•	Tennis (coming soon)
	•	Cycling (coming soon)

Behaviour:
	•	If the sport is “coming soon”, you can choose one of:
	1.	allow creation but with restricted features and a “coming soon” environment
	2.	direct into waitlist flow instead of full onboarding
	3.	invite-only creation

The decision should be a simple configuration flag per sport.

6.2 What club type controls

Once selected, club type determines:
	•	which templates are available
	•	which feature modules appear in the hub
	•	which default pages are created
	•	which widgets appear in the website editor
	•	sport-specific terminology and labels

This requires database changes and feature gating logic.

⸻

7) Club website requirements (for each tenant)

The club website must be modern, beautiful, and dynamic-content heavy, mobile-first.

7.1 Public club website pages (must exist)

These pages must exist as part of the club site, and each must be:
	•	editable
	•	draft/published toggle (or visible/hidden)
	•	included/excluded from nav via toggles

Required pages:
	•	Home (dynamic, template-driven, widgets)
	•	About
	•	Blog (News)
	•	History
	•	Gallery (dynamic content from gallery)
	•	Contact (form-driven)
	•	Legal hub (or separate pages):
	•	Privacy Policy
	•	Terms of Service
	•	Cookie Policy
	•	GDPR page
	•	RSS Feed (system-generated)

7.2 Draft/publish toggles and navigation

For every page:
	•	status: Draft / Published
	•	nav visibility: Show / Hide
	•	ordering in nav (within constraints)

7.3 Dynamic content emphasis

Homepage and key pages should lean into:
	•	content blocks / sliders / sections that are fed from posts, fixtures/results, gallery items, sponsors
	•	mobile-friendly layouts (cards, carousels/slider blocks where appropriate)
	•	“keep the site active” by automatically featuring:
	•	latest posts
	•	upcoming fixtures
	•	recent results
	•	sponsor highlights
	•	gallery highlights

⸻

8) Clubify Hub (admin experience) as the “home of everything”

The dashboard must be the hub for managing the club across time: website + social now, and fundraising/membership/policies later.

This means the admin UI must be designed to avoid clutter from day one.

8.1 Admin IA: “Now” vs “Later”

Admin navigation should be organized into two levels:

Core (MVP)
	•	Dashboard
	•	Website Editor
	•	Posts
	•	Pages
	•	Fixtures & Results
	•	Gallery
	•	Sponsors
	•	Forms
	•	Inbox
	•	Social Publishing
	•	Users & Roles
	•	Audit Log
	•	Settings (club info, domains, branding)

Modules (Coming soon)
	•	Membership
	•	Fundraising
	•	Payments
	•	Policy & GDPR toolkit
	•	Ticketing
	•	Merch

Modules must be:
	•	collapsible
	•	clearly labelled as “Coming soon”
	•	not cluttering the core navigation

8.2 Club dashboard requirements (keep it active)

The club dashboard must be club-relevant and designed to encourage ongoing activity. It should not waste space on technical details like template name.

Required dashboard widgets:
	•	Quick actions: New post, Update homepage, Add fixture, Add result
	•	Latest posts (draft/scheduled/published)
	•	Upcoming fixtures & latest results
	•	Inbox summary (new submissions)
	•	Social publishing status (success/fail, last run)
	•	Content suggestions (simple prompts)
	•	Optional external feed widget (e.g., sport news like GAA.ie) if and only if:
	•	clearly labelled “External”
	•	can be toggled off
	•	does not distract from publishing flow

8.3 Super Admin dashboard (Clubify operator)

Super Admin hub must support:
	•	list of clubs with sport type + health
	•	last activity date
	•	domain status (custom domain verified? SSL ok?)
	•	publish job failure counts
	•	social connections status
	•	ability to help resolve onboarding issues
	•	platform-wide settings for sports/templates/features

This must remain list-first and action-oriented.

⸻

9) Website Editor requirement (drag-and-drop with guardrails)

You now want the admin “homepage nav bar” to be a Website Editor with drag-and-drop widgets, plus ability to change templates, while still enforcing structure.

9.1 What “drag-and-drop” means here

This is a guardrailed layout editor, not a freeform builder.
	•	Each template defines “slots” (sections) on the homepage and potentially other pages.
	•	Admins can:
	•	add approved widgets into allowed slots
	•	reorder widgets within a slot (if permitted)
	•	toggle widgets on/off
	•	configure widget settings
	•	Admins cannot:
	•	change typography/spacing system
	•	add custom CSS
	•	create arbitrary grid layouts
	•	exceed slot constraints

9.2 Widget library (sport-aware)

Widgets are available based on club type (sport). Example categories:
	•	Content widgets: Latest posts, Featured post, Notices
	•	Sport widgets: Fixtures, Results (for sports supporting it)
	•	Engagement widgets: CTA, newsletter (later), forms embed
	•	Commercial widgets: Sponsors, sponsor carousel
	•	Media widgets: Gallery highlights
	•	Utility widgets: Contact CTA

⸻

10) Inbox requirement (GDPR compliant)

You require a dedicated Inbox in admin that shows:
	•	Contact form submissions
	•	Form builder submissions

Inbox features:
	•	status: new / read / archived
	•	filtering by form
	•	export (for compliance workflows)
	•	retention policy options

GDPR principles to include:
	•	collect minimal data by default
	•	clear purpose statement on each form
	•	retention controls
	•	role-based access

⸻

11) Forms requirement (GDPR compliant, simple)

The admin must be able to create forms easily:
	•	use templates (contact, volunteer, sponsor inquiry, etc.)
	•	drag/drop field builder
	•	publish a form to a page or embed as a widget
	•	submissions go to Inbox
	•	each form includes GDPR purpose + retention settings

⸻

12) Sponsors requirement (structured sponsor profiles)

Sponsors need to be first-class structured content.

Each sponsor profile should support:
	•	name, logo, website
	•	sponsorship type (main sponsor, kit sponsor, website sponsor, etc.)
	•	scope (whole club vs team/age bracket)
	•	optional start/end dates
	•	featured flag

Sponsors should automatically render in:
	•	Sponsors page (dynamic)
	•	homepage sponsor widgets
	•	optionally team pages later

⸻

13) Data model and migration requirements (new)

You explicitly stated: adding club type selection means DB migrations and logic updates across the system.

13.1 New core concept: Club Type (Sport)

Add:
	•	club_type (enum-like) to the club record:
	•	GAA, football, rugby, athletics, golf, tennis, cycling

13.2 Feature gating by club type

Create a configuration model that defines which features exist per club type:
	•	enabled modules (website, social, fixtures/results, etc.)
	•	enabled widgets (website editor)
	•	enabled content types (some sports may not use fixtures/results initially)
	•	enabled default pages

This should be data-driven (config tables), not hard-coded everywhere.

13.3 Template library becomes sport-scoped

Templates must be associated with:
	•	club_type
	•	template_id
	•	allowed widgets and slots

So “3 templates per sport” becomes a concrete library.

13.4 Page toggles (draft/publish and nav visibility)

Pages must include:
	•	status (draft/published)
	•	nav visibility (show/hide)
	•	nav order (within constraints)
	•	system-generated pages (RSS, legal) treated consistently (some may be locked but togglable)

13.5 Prevent UI clutter through modular navigation config

The navigation should be generated based on:
	•	club_type
	•	enabled modules
	•	user role

This ensures the hub stays tidy as you add fundraising/membership later.

⸻

14) Pricing rule

Pricing is identical across club types.
The marketing site must reinforce this clearly to avoid confusion.

⸻

15) Mobile parity rule (must be designed in from day one)

You stated: “whatever the club website can do, the mobile app will need to be able to do.”

This means:
	•	admin experience must be usable on mobile (at least for core tasks)
	•	public site interactions must translate to app UI
	•	dynamic content blocks and pages must render well in both environments
	•	publishing workflows must work from mobile without hidden desktop-only complexity

⸻

16) MVP scope and rollout strategy (to keep it achievable)

Given the broadened scope (multi-sport marketing + sport-specific templates + new club_type gating), the MVP should be defined as:

16.1 MVP “ready now” features (GAA only, fully functional)
	•	GAA onboarding leads to fully working club
	•	GAA templates (3) fully usable
	•	Website Editor + widgets for GAA
	•	Posts/pages/fixtures/results/gallery/sponsors/forms/inbox
	•	Social publishing (at least one platform)
	•	Roles and audit log

16.2 Coming soon sports (marketing complete, product gated)
	•	Sport pages exist with templates previewed
	•	Onboarding allows:
	•	waitlist flow OR
	•	gated early access (optional)
	•	Product functionality limited until ready

This protects simplicity and prevents you shipping half-broken multi-sport functionality.

⸻

17) Acceptance criteria (“Definition of Done”)

Marketing site
	•	clubify.ie is a modern, responsive multi-page site (no anchor-menu dependence)
	•	includes sport pages for:
	•	GAA (ready) + others (coming soon)
	•	templates showcased per sport (3 each)
	•	pricing is clear and consistent across sports
	•	clear CTA behaviour:
	•	create club for GAA
	•	waitlist / request access for coming soon

Onboarding
	•	first step includes club type selection
	•	club creation provisions:
	•	clubslug.clubify.ie
	•	optional myclub.ie onboarding flow (automated SSL + validation)
	•	club type determines templates, widgets, pages, features

Club hub and site
	•	club dashboard is activity-centric (posts, fixtures/results, inbox, social status)
	•	Website Editor is drag/drop with guardrails
	•	default pages exist and are editable + draft/publish toggles:
	•	Legal pages, RSS, About, Blog, Contact, History, Gallery, etc.
	•	Inbox works and is GDPR-minded
	•	Forms builder works and is GDPR-minded
	•	Sponsors are structured and render dynamically
	•	The same capabilities are available in the app UI (mobile parity)

Super Admin
	•	super admin dashboard shows clubs, types, activity, domain status, failures
	•	can support onboarding/domain issues without deep digging
	•	can manage templates/features per sport
Clubify monorepo spec (short version): 3 areas, Cloudflare-friendly

Goal

Keep the codebase scalable without getting complicated: separate Marketing, App UI, and Platform/API so sports/templates/modules don’t explode your Astro src/pages.

⸻

1) The 3 areas

A) Marketing (Astro) — clubify.ie

Purpose: fast pages + SEO + conversion
	•	/ /pricing /templates /security /contact
	•	/sports/{gaa|football|rugby|athletics|golf|tennis|cycling} (GAA live, others coming soon)
Rules:
	•	No tenant logic
	•	No admin hub UI
	•	Can post to waitlist/contact endpoints only

B) App UI (React) — tenant site + hub + future Capacitor

Purpose: everything that must match mobile parity
	•	clubify.ie/admin (global login + onboarding + tenant select)
	•	clubslug.clubify.ie/* (public tenant site)
	•	clubslug.clubify.ie/admin/* (club hub)
	•	Custom domains: myclub.ie/* and myclub.ie/admin/*
Rules:
	•	One UI stack for web + mobile parity
	•	Feature/module visibility driven by config (sport + role)

C) Platform/API (Cloudflare Worker)

Purpose: tenancy + auth + domains + content + jobs
	•	auth/session
	•	clubs + onboarding
	•	domain onboarding + verification + SSL status
	•	content: posts/pages/fixtures/gallery/sponsors/forms/inbox
	•	audit log + super admin endpoints
Rules:
	•	API is the only place that touches DB directly

⸻

2) Repo layout (minimal monorepo)

.
├── apps
│   ├── marketing      # Astro marketing site
│   └── app            # React app (tenant + admin hub)
├── services
│   └── api            # Cloudflare Worker API
├── packages
│   ├── core           # shared types, permissions, feature gating helpers
│   ├── config         # sports + templates + module enablement registry
│   └── ui             # shared React UI components (admin design system)
├── db
│   └── migrations     # SQL migrations (kept simple)
└── infra
    └── wrangler       # wrangler configs + scripts


⸻

3) Cloudflare deployment

Deployables
	•	Cloudflare Pages: apps/marketing → clubify.ie
	•	Cloudflare Pages: apps/app → *.clubify.ie + clubify.ie/admin
	•	Cloudflare Worker: services/api → api.clubify.ie (or same zone route)

Routing intent
	•	clubify.ie/* → marketing
	•	clubify.ie/admin/* → app
	•	*.clubify.ie/* → app
	•	*.clubify.ie/admin/* → app
	•	myclub.ie/* → app (after domain onboarding)

⸻

4) Sports + templates (data-driven)

In packages/config define each sport once:
	•	status: live / coming_soon
	•	onboardingMode: allow_create / waitlist_only / invite_only
	•	templates: exactly 3 per sport
	•	enabledModules: list of module IDs
	•	enabledWidgets: list of widget IDs
	•	defaultPages: home/about/blog/history/gallery/contact/legal/rss

Rule: no “if gaa” logic outside core + config.

⸻

5) Admin navigation + modules (simple rule)

Admin sidebar is generated from:
	•	club.club_type (sport config)
	•	enabled modules
	•	user role permissions
	•	“Core” vs “Modules (Coming soon)” grouping

No manual nav links scattered across pages.

⸻

6) Minimum DB changes required
	•	Add clubs.club_type (gaa/football/…)
	•	Ensure templates are sport-scoped: templates.club_type
	•	Domain mapping table: club_domains(hostname, club_id, status)
	•	Pages have toggles: status, nav_visible, nav_order

⸻

7) Implementation order (fast + safe)
	1.	Create monorepo folders + move marketing into apps/marketing
	2.	Create packages/config (sports/templates registry)
	3.	Move hub/tenant UI into apps/app (keep API as-is)
	4.	Update onboarding: Step 0 select sport (from config)
	5.	Generate admin nav from config + role gating

