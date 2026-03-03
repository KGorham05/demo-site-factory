# Copilot Instructions for Demo Site Factory

## Project Overview

- Monorepo for an automated pipeline that generates demo websites for local businesses without websites.
- Target market: Home Services (plumbers, electricians, HVAC, landscaping, cleaning).
- Built with Astro (site templates), Node.js/TypeScript (CLI tools), Tailwind CSS, and deployed to Vercel.

## Key Directories

- `templates/home-services/`: Astro site template for home service businesses.
- `src/lead-finder/`: CLI tool that uses Google Places API to find businesses without websites.
- `src/site-generator/`: CLI tool that hydrates templates with business data and outputs deployable sites.
- `src/types/`: Shared TypeScript types used across all packages.
- `data/leads/`: JSON files containing lead data organized by market/region.
- `generated/`: Output directory for generated demo sites (gitignored).

## Critical Workflows

- **Install:** `pnpm install`
- **Test:** `pnpm test` (Vitest)
- **Lint:** `pnpm lint` / `pnpm lint:fix`
- **Format:** `pnpm format` / `pnpm format:check`
- **Find leads:** `pnpm find-leads`
- **Generate site:** `pnpm generate-site`

## Coding Patterns

- **TypeScript:** Strict mode, explicit types and interfaces. Shared types in `src/types/`.
- **Functional style:** Pure functions, no mutation, minimal side effects.
- **ESM:** All packages use ES modules.
- **File naming:** kebab-case for all files and folders.
- **Imports:** Node built-ins → external packages → internal modules → type-only.
- **Error handling:** Custom error classes for domain errors. No bare `throw new Error()`.

## Astro Template Conventions

- Pages use `.astro` files with Astro layouts.
- Interactive components (forms, galleries) use React with `.tsx` extension.
- Content (business data) lives in YAML/Markdown content collections.
- Styles use Tailwind CSS utility classes.
- Minimize client-side JavaScript — ship zero JS unless interaction is required.

## Testing

- All new logic must have Vitest tests.
- Use factories or fixtures for test data generation.
- Place tests adjacent to source files as `*.test.ts`.

## Before Submitting

- Run `pnpm test && pnpm lint` and ensure both pass.
- If a test fails, clarify whether to update the test or the implementation.
- Avoid unnecessary complexity and technical debt.
