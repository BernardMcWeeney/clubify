Perfect — here is the full, clean, no-nonsense design system transformation spec you can hand directly to an AI coder or dev team. This is authoritative, opinionated, and designed to stop inconsistency dead.

⸻

Clubify Admin — Design System & UI Consistency Spec

Stripe-inspired · Subtle colour · Icon-led · Full-width but structured

⸻

1. Objective (Non-negotiable)

Refactor the entire Clubify Admin area so that every page, modal, setting, sub-page and state:
	•	Shares the same layout framework
	•	Uses identical typography rules
	•	Uses identical spacing rhythm
	•	Uses subtle colour accents only
	•	Uses one icon system
	•	Feels like one product, not multiple UIs

This is a design system transformation, not cosmetic tweaks.

⸻

2. Scope (Must be applied everywhere)
	•	Dashboard
	•	Website
	•	Posts
	•	Pages
	•	Fixtures
	•	Media
	•	Sponsors
	•	Forms
	•	Inbox
	•	Team
	•	Settings
	•	Activity
	•	All modals, drawers, dialogs
	•	All tables, forms, empty states
	•	All loading, error, and success states

No exceptions.

⸻

3. Design Inspiration (Lock this in)

Primary inspiration:
Stripe Dashboard UI

Key qualities to emulate:
	•	Calm, neutral surfaces
	•	Strong hierarchy
	•	Structure over decoration
	•	Subtle colour used sparingly
	•	Icons everywhere, but never loud
	•	Full use of horizontal space without feeling stretched

⸻

4. Global App Layout (Mandatory)

4.1 App Shell

All admin pages must use the same shell:
	•	Left sidebar (fixed)
	•	Top header bar (sticky)
	•	Main content area (scrolls)

No page may bypass this shell.

⸻

4.2 Content Width Rules (Fix “too much space” issues)

Use one layout system only:

Default layout
	•	max-width: 1280–1440px
	•	width: 100%
	•	Horizontal padding: 24px desktop / 16px mobile

Wide layout (tables only)
	•	max-width: 1600px or full width
	•	Enabled via layout="wide"

Rules:
	•	No page invents its own width
	•	No arbitrary margins
	•	No narrow, centred “floating” pages

⸻

5. Header + Breadcrumb System (Required everywhere)

5.1 Breadcrumbs

Every page must show breadcrumbs:

Position:
	•	Top-left in the page header
	•	Above or beside the page title

Style:
	•	Small, muted text
	•	Clickable except current page

Examples:
	•	Dashboard
	•	Website / Pages
	•	Posts / Edit post
	•	Settings / Team

Purpose:
	•	Clear orientation
	•	Stripe-style clarity
	•	No “where am I?” confusion

⸻

5.2 Page Header Structure

All pages must follow this structure:
	•	Breadcrumbs
	•	Page title (left)
	•	Optional subtitle (below title)
	•	Primary action (right)
	•	Optional status chip(s)

No page may move actions into the body randomly.

⸻

6. Typography System (Single source of truth)

Only these text styles may be used:
	•	Page title: 24–28px, semibold
	•	Section title: 16–18px, semibold
	•	Body text: 14–16px, regular
	•	Form labels: 12–13px, medium
	•	Helper / meta text: 12px, muted
	•	Table header: 12–13px, medium, muted
	•	Table body: 14px

Rules:
	•	No custom heading sizes per page
	•	No bold text used as a heading substitute
	•	Muted text always uses the same muted token

⸻

7. Spacing & Rhythm (Stop layout drift)

Define a spacing scale and enforce it:
	•	Page padding: 24px
	•	Section spacing: 24px
	•	Section title → content: 12px
	•	Card padding: 16px
	•	Form field spacing: 12–16px
	•	Button group spacing: 8–12px

Rules:
	•	No inline margins
	•	No “looks about right” spacing
	•	All spacing must come from tokens

⸻

8. Colour System (Subtle by design)

8.1 Core Tokens

Define and use globally:
	•	--bg-app
	•	--bg-card
	•	--border-default
	•	--text-primary
	•	--text-muted
	•	--primary
	•	--primary-weak
	•	--success / warning / danger (+ weak variants)

⸻

8.2 Where colour IS allowed
	•	Primary buttons
	•	Status chips (Live, Draft, Published)
	•	Active nav item
	•	Selected tabs
	•	Small icon backgrounds
	•	Focus states

Colour must be subtle and controlled.

⸻

8.3 Where colour is NOT allowed
	•	No gradients on main surfaces
	•	No tinted page backgrounds
	•	No large colour blocks
	•	No decorative colour for its own sake

Gradients are explicitly banned for admin surfaces.

⸻

9. Icon System (Consistency required)
	•	Use one icon set only
	•	Outline style preferred
	•	Consistent stroke weight

Sizes:
	•	Sidebar icons: 16–18px
	•	Action tiles: 18–20px
	•	Inline icons: 14–16px

Rules:
	•	Icons are muted by default
	•	Colour only on hover, active, or status
	•	No mixing icon styles across pages

Icons provide structure, not decoration.

⸻

10. Cards & Surfaces (Fix “blank” pages)
	•	App background: light neutral
	•	Cards: white
	•	Either:
	•	soft border or
	•	soft shadow
(pick one and use everywhere)

Rules:
	•	All pages must be built from cards/sections
	•	Cards create structure even when colour is minimal
	•	No floating, uncontained content blocks

⸻

11. Component System (Mandatory usage)

11.1 Page Template

AdminPageTemplate
	•	Handles header, breadcrumbs, width, spacing
	•	Required for every route

11.2 Sections

AdminSection
	•	Title
	•	Optional description
	•	Optional actions
	•	Standard spacing

11.3 Cards

AdminCard
	•	Standard padding, border/shadow, radius
	•	Optional subtle accent border

11.4 Forms
	•	FormField wrapper (label, input, help, error)
	•	Standard validation styles
	•	Consistent focus states

11.5 Tables
	•	Standard table wrapper
	•	Filter row
	•	Empty state
	•	Pagination
	•	Subtle row hover

11.6 Modals / Drawers
	•	Title
	•	Description (optional)
	•	Body
	•	Footer with actions
	•	Sizes: sm, md, lg only

No custom modal layouts allowed.

⸻

12. Status Chips & Feedback
	•	Pills with subtle background tint
	•	Rounded
	•	Small text
	•	Clear colour meaning (success, neutral, warning)

Use them sparingly and consistently.

⸻

13. Loading, Empty & Error States
	•	Skeletons for loading
	•	Friendly empty states with icons
	•	Inline error messaging
	•	No raw text dumps

All states must feel intentional.

⸻

14. Anti-Drift Rules (Critical)

To prevent future inconsistency:
	•	No inline styles for spacing/colour/typography
	•	No arbitrary hex colours
	•	No per-page layout hacks
	•	Any new variant must be added to the shared system first

If it’s not in the system, it doesn’t ship.

⸻

15. Definition of Done

A page is complete only if:
	•	Uses the shared page template
	•	Has breadcrumbs
	•	Uses standard spacing & typography
	•	Uses subtle colour accents only
	•	Uses shared components
	•	Matches Stripe-like calm consistency

⸻

This spec is the source of truth.
Anything that doesn’t match it is considered incorrect, even if it “looks fine”.