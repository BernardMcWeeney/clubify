# Clubify

All-in-one website and app platform for GAA clubs.

## Tech Stack

- **Framework**: [Astro](https://astro.build/) v5
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Hosting**: [Cloudflare Workers](https://workers.cloudflare.com/)

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
├── components/     # Reusable UI components
│   ├── Button.astro
│   ├── Card.astro
│   ├── Section.astro
│   ├── Navigation.astro
│   ├── Hero.astro
│   ├── HowItWorks.astro
│   ├── Features.astro
│   ├── Templates.astro
│   ├── Trust.astro
│   ├── CTA.astro
│   └── Footer.astro
├── layouts/        # Page layouts
│   └── Layout.astro
├── pages/          # File-based routing
│   ├── index.astro
│   └── admin/
│       └── index.astro
└── styles/         # Global styles
    └── global.css
```

## Features

- Modern, Stripe-inspired design
- GAA-specific branding and colors
- Animated gradient backgrounds
- Responsive mobile-first layout
- Dark mode by default
- Accessibility-focused
- GDPR-compliant design patterns

## License

Copyright © 2024 Clubify. All rights reserved.