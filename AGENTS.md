# FabSystem AI Guide

## Purpose

This file is the primary guide for any AI agent or developer working on FabSystem.

Read it before proposing architecture, database, Stripe, auth, or UI changes.

The project is already in production. The main rule is simple: protect the live site first.

## Project Snapshot

FabSystem is currently a Next.js 16 application that already runs in production and combines:

- a public marketing website
- lead generation and contact flows
- an internal admin dashboard
- customer, quote, invoice, discount, and PDF management
- a first Stripe flow for one ebook

The next milestone is not a universal commerce platform.

The next milestone is a pragmatic MVP able to sell:

- ebooks
- ebook bundles
- additional digital downloads

with:

- a product catalog
- a multi-product cart
- one Stripe Checkout flow
- orders
- secure downloads
- a minimal customer account
- minimal catalog administration

Everything else stays out of the MVP for now.

## Important Legacy Decision

The current ebook flow is now officially `LEGACY`.

This includes:

- `EbookOrder`
- `/api/ebook/checkout`
- `/api/ebook/download`
- `/ebook/acces/[token]`
- Vercel Blob based ebook delivery
- `STRIPE_PRICE_ID_EBOOK`
- `EBOOK_ACCESS_TOKEN_SECRET`
- ebook-specific operational scripts

It may remain temporarily in production, but:

- it must not be extended
- it must not be reused as the foundation of the new commerce engine
- it must not drive the future data model

## Fixed Scope

### Included in the MVP

- digital catalog
- `BUY_NOW` products only
- server-side cart validation
- Stripe Checkout in `payment` mode
- paid orders
- download rights
- purchase history
- minimal customer login

### Explicitly out of scope for the MVP

- subscriptions
- courses and learning platform features
- physical products
- stock management
- shipping
- booking slots
- marketplace
- multi-vendor logic
- advanced international tax engine

These topics may be documented as future extensions, but they must not shape the MVP data model too early.

## Product Boundary

FabSystem now uses two business categories.

### `BUY_NOW`

Can go directly into the cart and be paid immediately.

MVP examples:

- ebook
- ebook bundle
- digital download

### `REQUEST_ONLY`

Cannot enter the MVP cart.

Requires contact, qualification, quote, or booking before payment.

Examples:

- custom diagnostic
- on-site service
- complex consulting
- physical installation

Rule: `REQUEST_ONLY` offers keep using the current contact, quote, or reservation paths until a later dedicated project exists.

## Non-Negotiable Rules

1. Do not break the production site.
2. Do not remove existing features unless explicitly planned.
3. Prefer additive changes over rewrites.
4. Do not modify `schema.prisma` without a prior documented data plan.
5. Do not turn the MVP into a universal commerce abstraction.
6. Any critical payment or fulfillment flow must be durable and replayable.

## Current Stack

- Next.js 16.2.1
- React 19.2.3
- TypeScript 5
- Tailwind CSS 3.4.17
- Prisma 6.19.2
- PostgreSQL via `pg` and `@prisma/adapter-pg`
- Stripe 22.x
- Vercel Blob for the legacy ebook flow only
- Supabase Storage as the target for new digital assets
- Nodemailer
- Zod
- `@simplewebauthn/server`
- `@react-pdf/renderer`

## Current Runtime Areas

### Public site

Lives under `app/` and already serves:

- homepage and content pages
- service pages
- contact flows
- ebook page and checkout entry

### Internal dashboard

Lives under `app/dashboard/*` and is currently protected by:

- `middleware.ts`
- `requireSession()` in `app/dashboard/layout.tsx`

### Existing API families

- `/api/auth/*`
- `/api/contact`
- `/api/public/sign/quotes/[id]`
- `/api/ebook/checkout`
- `/api/ebook/download`
- `/api/stripe/webhook`
- `/api/internal/*`

### Current Prisma models

- `Customer`
- `Quote`
- `QuoteItem`
- `Invoice`
- `InvoiceItem`
- `Remise`
- `ItemTemplate`
- `DocumentSequence`
- `EbookOrder`

## Fixed Domain Separation

### Marketing domain

Still owns:

- public pages
- SEO content
- lead generation

### Documents domain

Still owns:

- customers
- quotes
- invoices
- remises
- PDF generation

Current quote and invoice workflows remain in place during the commerce MVP.

### Legacy ebook domain

Still owns:

- `EbookOrder`
- legacy ebook checkout and download routes
- legacy tokenized access pages
- legacy Vercel Blob storage

Rule:

- keep temporarily
- do not extend
- do not reuse for the new commerce engine

### Commerce MVP domain

Will introduce:

- `Product`
- `ProductPrice`
- `DigitalAsset`
- `Cart`
- `Order`
- `Payment`
- `DownloadGrant`

This domain is limited to digital `BUY_NOW` products.

Storage rule:

- new digital assets use Supabase Storage
- the legacy ebook flow may keep Vercel Blob until decommission

### Request-only domain

Still uses:

- contact
- quote
- current admin processes

It does not share the MVP cart or checkout.

## Identity Rules

- `User` is the login identity.
- `Customer` is the business identity.
- A `Customer` may be linked to zero or one `User`.
- An order always belongs to a `Customer`.
- Guest checkout may create a `Customer` without creating a `User`.
- Later account creation may attach past guest orders through a verified claim flow.
- Do not create a separate `CustomerProfile` in the MVP.

## Source of Truth Rules

- `Product` and `ProductPrice` are the source of truth for the current catalog.
- `DigitalAsset` is the local source of truth for sellable digital files.
- `Cart` is temporary pre-purchase state.
- `Order` is the source of truth for a completed commercial purchase.
- `Payment` is the local payment state.
- `DownloadGrant` is the source of truth for download authorization.
- Stripe is the external payment processor, not the main business source of truth.
- `OrderItem` stores immutable snapshots.
- Supabase Storage is the physical storage target for new private digital assets.
- `Invoice` remains the accounting document.
- `Quote` remains the commercial proposal.

## Architecture Direction

The architecture target is incremental, not revolutionary.

### Immediate target folders for new work

Logical target:

```text
app/
  (marketing)/
  (shop)/
    boutique/
    panier/
    checkout/
    merci/
  (account)/
    compte/
      commandes/
      telechargements/
  dashboard/
  api/
    commerce/
    stripe/
    internal/

components/
  shop/
  account/
  dashboard/
  shared/

lib/
  auth/
  catalog/
  cart/
  checkout/
  orders/
  downloads/
  storage/
    supabase/
  stripe/
  server/
```

This is a target for new work. It does not require a destructive move of existing routes.

## Next.js Rules

- App Router remains the standard.
- Default to Server Components.
- Add `"use client"` only for real browser interactivity.
- Route handlers validate inputs, then call services.
- Do not place payment or order business logic directly in route files.
- Any auth-sensitive page or route must make its cache behavior explicit.

## React Rules

- Keep components focused.
- Separate presentation from orchestration when a component starts managing cart, checkout, or account state.
- Do not enlarge already heavy files without first extracting subcomponents.
- Accessibility is mandatory for cart, checkout, dialogs, and account pages.

## Prisma Rules

- Do not replace existing document tables.
- Extend with additive commerce tables.
- Store money in integer cents.
- Add unique constraints to external IDs such as Stripe event IDs and checkout session IDs.
- Use immutable snapshots on `Order` and `OrderItem`.
- Do not over-model future domains such as shipping, inventory, subscriptions, or course curricula in the MVP.

### MVP catalog rule

The catalog core stays intentionally small:

- `Product`
- `ProductPrice`
- `DigitalAsset`

Minimal join tables are acceptable only when required to express:

- product-to-asset delivery
- bundle composition

`DigitalAsset` should be designed around Supabase Storage metadata:

- provider = `SUPABASE`
- bucket
- path
- filename
- contentType
- sizeBytes
- version

## Stripe Rules

- The current ebook flow may coexist temporarily with the future generic checkout.
- The current ebook flow is legacy only.
- The MVP generic checkout only handles `BUY_NOW` digital products.
- Prices are recalculated server-side from local data.
- Browser totals are never trusted.
- Browser redirects after Stripe Checkout must never mark an order as paid.
- Only a valid Stripe webhook processed idempotently can confirm payment.
- Critical webhook side effects must be durable:
  - store the Stripe event
  - update order/payment state transactionally
  - enqueue a durable background job
  - allow replay on failure

New digital download rule:

- the server verifies `DownloadGrant`
- the server generates a short-lived signed URL from Supabase Storage
- application code imports Supabase Storage through `@/lib/server/supabase-storage` only
- `@/lib/supabase-storage` stays limited to pure testable logic and tests
- no client-side private URL generation

## Security Rules

Before commerce launch, the minimum bar is:

- lint errors fixed
- complete environment variable contract
- secure cookies confirmed
- account and admin routes protected
- Stripe secrets verified
- webhook idempotency implemented
- rate limiting adapted to Vercel or distributed
- no paid file in `/public`
- server-side authorization for downloads
- no new commerce asset on Vercel Blob
- no long-lived public digital file URL
- rollback and backup procedure documented

WebAuthn durability and admin MFA remain important, but they are not blockers for Sprint 0.

## Testing Rules

Minimum expected coverage before each commerce sprint:

- auth regression tests
- cart validation tests
- checkout service tests
- Stripe webhook idempotency tests
- download authorization tests
- snapshot integrity tests for orders and invoices

## Documentation Rules

- `docs/00-VISION.md` defines the business direction.
- `docs/01-ROADMAP.md` defines sprint order.
- `docs/02-ARCHITECTURE.md` defines domain and route boundaries.
- `docs/03-DATABASE.md` defines target schema evolution.
- `docs/04-STRIPE.md` defines payment architecture.
- `docs/07-SECURITY.md` defines the minimum security baseline.
- `docs/08-DECISIONS.md` stores stable architecture decisions.
- `docs/10-GLOSSARY.md`, `docs/11-SOURCE-OF-TRUTH.md`, `docs/12-STATE-MACHINES.md`, and `docs/13-MVP-SCOPE.md` must stay aligned with the core documents.
- `docs/14-SUPABASE-STORAGE.md` documents the target storage strategy.
- `docs/15-LEGACY-EBOOK-DECOMMISSION.md` documents the exit plan for the old ebook flow.

If a code change contradicts those documents, update the documentation first or as part of the same change.

## Implementation Order

1. Stabilize the current application.
2. Freeze the legacy ebook system as legacy only.
3. Add Supabase Storage foundations.
4. Add the digital catalog.
5. Add the digital cart.
6. Add generic orders and Stripe payment state.
7. Add secure digital fulfillment through `DownloadGrant`.
8. Add the minimal customer area.
9. Migrate away from the legacy ebook flow.

## When In Doubt

- Choose the smaller safe design.
- Keep `REQUEST_ONLY` outside the cart.
- Keep documents and commerce as connected but separate domains.
- Prefer one clear rule over one universal abstraction.
- Do not build new commerce features on the legacy ebook stack.
