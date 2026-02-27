# Tailormade

Tailormade is a mobile-first web OS for Nigerian tailors. It replaces notebooks, WhatsApp message searching, and memory-based tracking with structured workflows for customers and jobs.

## Stack

- Vite + React + TypeScript
- React Router
- TailwindCSS + `@tailwindcss/forms`
- TanStack Query + Zustand
- React Hook Form + Zod
- Typed fetch wrapper (`src/lib/api/client.ts`)

## Features Included (MVP)

- Auth flow: Phone -> OTP verify
- Dashboard: overdue/due metrics, monthly income, frequent customers, pending sync badge
- Customers: list/search/add + duplicate phone handling
- Customer profile: WhatsApp deep link, Active/Past jobs tabs
- Jobs: status-filtered list, detail screen, quick status updates
- New Job: customer select/create, delivery date, agreed price, measurement snapshot builder, optional images
- Offline support:
  - Draft autosave for add customer and new job forms
  - Retry queue for failed `POST`/`PATCH` requests
  - FIFO sync replay on startup and when connection returns

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Run dev server:

```bash
npm run dev
```

## Environment Variables

- `VITE_API_BASE_URL`: backend base URL. Leave empty to use same-origin paths.
- `VITE_DEMO_AUTH`: `true`/`false`. If unset, demo auth auto-enables when `VITE_API_BASE_URL` is empty.

## Scripts

- `npm run dev` - start development server
- `npm run build` - typecheck + production build
- `npm run test` - run Vitest test suite
- `npm run test:watch` - watch mode tests

## Project Structure

```txt
src/
  app/
  components/
  features/
    auth/
    customers/
    dashboard/
    jobs/
    offline/
  lib/
  types/
```

## Tests

Implemented tests cover:
- Zod schemas (`src/features/jobs/schemas.test.ts`)
- Retry queue logic (`src/features/offline/retryQueue.test.ts`)
- Phone normalization utility (`src/lib/utils/phone.test.ts`)
