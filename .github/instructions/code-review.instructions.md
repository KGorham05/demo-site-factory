# Code Review Instructions

## Review Language

English

## Review Priorities

### Critical (Must Fix)

- Security vulnerabilities (injection, XSS, exposed secrets)
- Correctness issues (logic errors, data loss risks)
- Breaking changes to existing functionality

### Important (Should Fix)

- Code quality (readability, maintainability, DRY)
- Test coverage for new logic
- Performance issues (unnecessary re-renders, N+1 queries, unbounded loops)

### Suggestions (Nice to Have)

- Readability improvements
- Better naming
- Pattern consistency

## General Principles

- Be specific — reference exact lines and suggest concrete fixes.
- Provide context — explain _why_ something is an issue, not just _what_.
- Be constructive — suggest solutions, not just problems.

## Architecture Checks

- CLI tools should be thin entry points that delegate to service modules.
- Astro templates should minimize client-side JS.
- Shared types belong in `src/types/`, not duplicated across packages.
- Lead data flows one direction: lead-finder → data/leads/ → site-generator → generated/.

## Security Review

- No API keys or secrets in committed code (use `.env` files).
- Validate and sanitize all external input (Google Places API responses, user CLI args).
- Stripe integration must use server-side verification.

## Testing Standards

- All business logic must have tests.
- Test names should describe the expected behavior.
- Use factories for test data, not inline object literals.
