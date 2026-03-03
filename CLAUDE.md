# Demo Site Factory - Claude Code Context

## Project Overview

Automated pipeline for generating demo websites for local businesses that don't have one. Target market: **Home Services** (plumbers, electricians, HVAC, landscaping, cleaning).

### Pipeline Flow

1. **Lead Finder** - Google Places API finds businesses without websites in a target area
2. **Site Generator** - Hydrates an Astro template with business data to create a demo site
3. **Deploy** - Pushes demo to Vercel, generates a preview URL for the prospect
4. **Purchase** - Stripe checkout → on payment, connect custom domain + enhance the site

## Tech Stack

| Component              | Technology                        |
| ---------------------- | --------------------------------- |
| Site templates         | Astro + Tailwind CSS + TypeScript |
| Interactive components | React (forms, galleries only)     |
| CLI tools              | Node.js + TypeScript + Commander  |
| Lead finding           | Google Places API                 |
| Deployment             | Vercel API                        |
| Payments               | Stripe                            |
| Monorepo               | pnpm workspaces                   |
| Testing                | Vitest                            |
| Code quality           | ESLint + Prettier + Lefthook      |

## Project Structure

```
demo-site-factory/
├── templates/
│   └── home-services/          # Astro site template
│       ├── src/pages/          # Home, Services, About, Contact, Reviews
│       ├── src/components/     # Reusable Astro/React components
│       ├── src/layouts/        # Page layouts
│       ├── src/content/        # Content collections (Markdown + YAML)
│       └── astro.config.mjs
├── src/
│   ├── lead-finder/            # CLI tool: Google Places API integration
│   ├── site-generator/         # CLI tool: template hydration + output
│   └── types/                  # Shared TypeScript types
├── data/
│   └── leads/                  # Lead data JSON files (per market/region)
├── generated/                  # Output demo sites (gitignored)
├── .github/
│   ├── copilot-instructions.md
│   └── instructions/
└── CLAUDE.md                   # This file
```

## Coding Conventions

- **TypeScript**: Strict mode, explicit types and interfaces. Shared types in `src/types/`.
- **Functional style**: Prefer pure functions, avoid mutation.
- **File naming**: kebab-case for all files and folders.
- **Imports**: Group as Node built-ins → external packages → internal modules → type-only.
- **Error handling**: Use custom error classes for domain-specific errors.
- **No `console.log` in library code**: Use a structured logger or Commander output helpers.
- **ESM**: All packages use ES modules (`"type": "module"`).

## Critical Commands

```bash
pnpm install              # Install all dependencies
pnpm lint                 # Lint all packages
pnpm lint:fix             # Auto-fix lint issues
pnpm format               # Format all files
pnpm test                 # Run all tests
pnpm find-leads           # Run lead finder CLI
pnpm generate-site        # Run site generator CLI
```

## Template Pages (Home Services)

1. **Home** - Hero image, services overview, trust signals (licensed/insured/bonded), primary CTA
2. **Services** - Detailed service list with descriptions and pricing hints
3. **About** - Business story, team bios, certifications, years in business
4. **Contact** - Contact form, phone, email, address with map embed, business hours
5. **Reviews** - Customer testimonials and social proof

## Business Data Schema

Each lead/business is represented as a JSON object with fields like:

- `name`, `phone`, `address`, `city`, `state`, `zip`
- `industry`, `services` (array), `hours`
- `placeId` (Google Places), `rating`, `reviewCount`
- `status` (lead | demo_generated | demo_sent | purchased | deployed)

## Before Submitting Code

- Run `pnpm test && pnpm lint` and ensure both pass
- If a test fails, clarify with the user whether to update the test or the implementation
- Only optimize for what is necessary — avoid unnecessary complexity
