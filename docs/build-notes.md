# Build Notes

## Symptom

With Next.js `16.1.6`, `next build` could hang indefinitely on:

```text
Creating an optimized production build...
```

No compile error was emitted while Turbopack was building the server graph.

## Confirmed behavior

- `next build` with Turbopack stalled during compile.
- `next build --webpack` completed successfully.
- Runtime behavior was not affected.

## Cause

The issue is in the build pipeline, not in the application logic.

This project has a server-heavy dependency graph around:

- Prisma + `pg` + `@prisma/adapter-pg`
- `nodemailer`
- `qrcode`
- `@react-pdf/renderer`

On this codebase, Turbopack in Next `16.1.6` does not complete compilation reliably for that server graph.

## Solution kept in the codebase

- Production build uses Webpack:

```bash
npm run build
```

- Explicit scripts are available:

```bash
npm run build:webpack
npm run build:turbopack
```

- Server-only wrappers isolate heavy dependencies:
  - `lib/server/nodemailer.ts`
  - `lib/server/qrcode.ts`
  - `lib/server/pdf.ts`
  - `lib/server/prisma-adapter.ts`

- `serverExternalPackages` is configured in `next.config.ts` for the server-only packages involved in the problematic graph.

## Why the wrappers exist

They keep heavy dependencies out of scattered route-level dynamic imports and make the server boundary explicit.

They are intended to be imported only from:

- route handlers
- server components
- other server-only modules

They must not be imported from client components.

## Regression guard

`tests/server-boundaries.test.ts` checks that client modules do not import:

- `lib/server/*`
- Prisma/server logging/rate-limit internals
- `nodemailer`
- `qrcode`
- `@react-pdf/renderer`
- `pg`
- `@prisma/adapter-pg`

## How to retest Turbopack later

Run:

```bash
npm run build:turbopack
```

If that becomes stable on a future Next.js release, the default build script can be switched back after validation.

## Impact

- No functional runtime change is intended.
- The workaround affects build strategy and dependency isolation only.
