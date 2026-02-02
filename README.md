# Clubify

**All-in-one website + app platform for sports clubs.**

Clubify makes it easy for sports clubs to create professional websites and mobile apps without any technical skills. Launch your club's online presence in minutes, not months.

## Overview

Clubify is a SaaS platform designed specifically for sports clubs in Ireland. Built with modern web technologies, it provides clubs with everything they need to connect with members, manage fixtures, and share their story online.

### Key Features

**Website & Mobile App**
- Beautiful, responsive website that works on all devices
- Native iOS and Android mobile app
- Content syncs automatically between platforms
- Custom domain support (yourclub.clubify.ie or your own domain)

**Fixtures & Results**
- Sport-specific scoring (supports GAA, football, rugby, and more)
- Automatic league table generation
- Multiple team support
- Match reports and photo galleries

**News & Updates**
- Rich text editor with drag-and-drop images
- Scheduled publishing
- Categories and tags for organisation
- SEO-optimised for search engines

**Social Media Integration**
- Auto-publish to Facebook, Twitter/X, and Instagram
- Customise message per platform
- Track engagement and reach
- One-click sharing

**Push Notifications**
- Instant notifications to all members
- Match day reminders
- Breaking news alerts
- Segment by team or interest

**Team Management**
- Unlimited team members
- Role-based access (Admin, PRO, Editor, Viewer)
- Invite via email
- Complete audit trail

**Additional Features**
- Media library with up to 5GB storage
- Sponsor showcase with tiered visibility
- Custom contact forms
- Centralised inbox for enquiries
- Custom pages (about, history, etc.)
- GDPR compliant with EU data storage

## Supported Sports

Clubify is designed to work with multiple sports, each with sport-specific terminology and features:

- **GAA** (Live)
- **Football** (Coming Soon)
- **Rugby** (Coming Soon)
- **Athletics** (Coming Soon)
- **Golf** (Coming Soon)
- **Tennis** (Coming Soon)
- **Cycling** (Coming Soon)

## Tech Stack

- **Framework**: [Astro](https://astro.build/) v5
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Hosting**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The development server will start at `http://localhost:4321`

### Build

```bash
npm run build
```

### Deploy to Cloudflare

```bash
npx wrangler deploy
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Admin UI components
│   ├── sports/          # Sport-specific components
│   ├── templates/       # Template renderer components
│   ├── Button.astro
│   ├── Card.astro
│   ├── Section.astro
│   ├── Navigation.astro
│   ├── Hero.astro
│   ├── HowItWorks.astro
│   ├── Features.astro
│   ├── ProductShowcase.astro
│   ├── Templates.astro
│   ├── Pricing.astro
│   ├── FAQ.astro
│   ├── Trust.astro
│   ├── Contact.astro
│   ├── CTA.astro
│   └── Footer.astro
├── layouts/             # Page layouts
│   └── Layout.astro
├── lib/                 # Utilities and configuration
│   └── sports/          # Sport-specific data and config
├── pages/               # File-based routing
│   ├── index.astro      # Homepage
│   ├── about.astro
│   ├── features.astro
│   ├── pricing.astro
│   ├── contact.astro
│   ├── templates.astro
│   ├── sports/          # Sport pages
│   ├── admin/           # Admin portal
│   └── [slug]/          # Dynamic club routes
└── styles/              # Global styles
    └── global.css
```

## Pages

### Marketing Pages
- `/` - Homepage with hero, features, pricing, FAQ
- `/about` - About us, mission, and story
- `/features` - Full feature breakdown
- `/pricing` - Pricing plans and comparison
- `/contact` - Contact form and information
- `/templates` - Template showcase (21 templates)
- `/sports` - Sports hub and overview

### Sport-Specific Pages
- `/sports/GAA` - GAA club features
- `/sports/football` - Football club features
- `/sports/rugby` - Rugby club features
- `/sports/athletics` - Athletics club features
- `/sports/golf` - Golf club features
- `/sports/tennis` - Tennis club features
- `/sports/cycling` - Cycling club features

### Legal & Support
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- `/cookies` - Cookie Policy
- `/gdpr` - GDPR Information
- `/help` - Help Centre
- `/docs` - Documentation

## Design System

Clubify uses a consistent design system across all components:

### Colors
- **Primary**: Green (#22c55e) - Irish-inspired brand color
- **Accent**: Amber/Gold (#f59e0b) - Secondary accent
- **Neutrals**: Slate palette for text and backgrounds

### Typography
- System font stack for optimal performance
- Clear hierarchy with consistent sizing

### Components
- Consistent border radius (16px for cards, 12px for buttons)
- Subtle shadows for depth
- Smooth animations and transitions
- Glass morphism effects for modern feel

### Layout
- Max-width 7xl (1280px) containers
- Responsive padding (px-4 to lg:px-8)
- Mobile-first approach

## Pricing

Simple, transparent pricing with no hidden fees:

- **Monthly**: €50/month
- **Annual**: €499/year (save €101)
- 7-day free trial
- No credit card required to start

All plans include every feature with no per-feature charges.

## Security & Compliance

- GDPR compliant
- EU data storage (Ireland)
- SSL encryption (256-bit)
- 99.9% uptime SLA
- 24/7 monitoring
- Complete audit trails

## Contributing

This is a private project. For inquiries, contact hello@clubify.ie

## License

Copyright 2026 Clubify. All rights reserved.

---

Made with love in Ireland
