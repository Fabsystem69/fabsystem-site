# Production Hardening

## Scope

This phase hardens the public entry points, centralizes part of the business logic, and prepares the codebase for higher data volume and stricter production behavior.

## Implemented

### Security

- Added structured server logging in `lib/server-log.ts`.
- Added typed HTTP errors and centralized JSON error responses in `lib/http-errors.ts`.
- Added in-memory IP rate limiting for:
  - admin login
  - public contact
  - public quote signature
- Removed runtime `.env` file reads from admin login.
- Added stricter validation for public contact requests:
  - full Zod validation
  - honeypot support
  - minimum submit delay
  - MIME allowlist
  - per-file and total attachment limits
- Added stricter validation for public signature images:
  - PNG-only data URL
  - max payload size
  - image dimension bounds

### Business correctness

- Fixed PDF totals so `totalTtc` now uses `data.total`.
- Improved Prisma error mapping:
  - `400` validation
  - `404` not found
  - `409` conflict
  - `503` infrastructure

### Scalability

- Added paginated customer listing with search and limit handling.
- Added `DocumentSequence` persistent numbering model.
- Replaced timestamp-based document numbers with transactional sequence allocation:
  - `QUO-YYYY-0001`
  - `INV-YYYY-0001`

### Architecture

- Added service layer entry points:
  - `lib/services/customers.ts`
  - `lib/services/quotes.ts`
  - `lib/services/invoices.ts`
- Moved quote, invoice, and customer creation logic out of the main route handlers where it was directly coupled to Prisma writes.

### Cleanup

- Removed tracked `.DS_Store` files.
- Removed unused dependencies from `package.json`:
  - `next-auth`
  - `@auth/prisma-adapter`
  - `bcrypt`

### Tests

Added minimal automated coverage for:

- session token validation
- contact payload validation
- signature token/image validation
- quote payload validation
- PDF generation smoke test

## Deployment notes

### Prisma migration

This change requires the new migration:

- `prisma/migrations/20260228_add_document_sequence`

Deploy with:

```bash
npx prisma migrate deploy
npx prisma generate
```

## Known follow-up

The layout split into route groups `(public)` / `(internal)` was intentionally left out of this hardening phase because it is low priority relative to security and data integrity, and it touches a larger portion of the App Router tree.
