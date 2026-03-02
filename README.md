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

- Auth flow: phone + password
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

4. Build the production bundle (also validates the PWA manifest/service worker setup):

```bash
npm run build
```

5. Run the backend API (phone + password auth, no OTP):

```bash
npm run server
```

## Environment Variables

- `VITE_API_BASE_URL`: backend base URL, e.g. `http://127.0.0.1:4000`
- `VITE_DEMO_AUTH`: keep `false` when using the real backend
- `VITE_SUPPORT_WHATSAPP_PHONE`: support line used by the Forgot Password WhatsApp link

## Scripts

- `npm run dev` - start development server
- `npm run build` - typecheck + production build
- `npm run server` - start the local backend API on port 4000
- `npm run server:dev` - start the backend with Node watch mode
- `npm run test` - run Vitest test suite
- `npm run test:watch` - watch mode tests

## PWA Support

Tailormade is configured as a Progressive Web App using `vite-plugin-pwa`.

- Manifest is generated from `vite.config.ts`
- Service worker is registered in `src/main.tsx`
- App icons live in `public/icons/`

PWA icon files:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-512-maskable.png`

When deployed over HTTPS (for example on Vercel), supported browsers will offer install prompts / Add to Home Screen.

## Local Backend

Tailormade now includes a local backend in `server/index.cjs`.

- Storage: file-backed JSON at `server/data/runtime.json`
- Auth: `phone + password` (no OTP cost)
- Default port: `4000`
- Admin reset secret: `tailormade-local-admin` by default (override with `ADMIN_RESET_SECRET`)

Core backend routes:

- `POST /auth/register`
- `POST /auth/login`
- `PATCH /auth/profile`
- `POST /auth/verify-otp` (returns a message that OTP is disabled)
- `POST /admin/reset-password`
- `GET /customers`
- `POST /customers`
- `GET /customers/:customerId/measurements`
- `POST /customers/:customerId/measurements`
- `DELETE /measurements/:measurementId`
- `POST /measurements/:measurementId/create-job`
- `PATCH /measurements/:measurementId/create-job`
- `GET /jobs`
- `POST /jobs`
- `PATCH /jobs/:jobId`
- `GET /dashboard`

Current limitation:

- Password recovery is support-assisted:
  - users tap `Forgot Password`
  - users contact support on WhatsApp
  - support resets the password through the admin reset endpoint

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
