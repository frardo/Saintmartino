# SAINT MARTINO Jewelry E-commerce Store

## Overview

This is a premium jewelry e-commerce storefront called "SAINT MARTINO" — a full-stack web application with a React frontend and Express backend, backed by a PostgreSQL database. The app displays jewelry products (rings, necklaces, earrings) with filtering, sorting, and product detail views. The design aesthetic is luxury/minimalist with a warm beige color palette, serif headings (Playfair Display), and smooth Framer Motion animations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, built with Vite
- **Routing**: Wouter (lightweight client-side router) — routes defined in `client/src/App.tsx`
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives — all components live in `client/src/components/ui/`
- **Styling**: Tailwind CSS with CSS variables for theming. Custom premium beige palette defined in `client/src/index.css`. Sharp corners (`--radius: 0rem`) for luxury feel.
- **Animations**: Framer Motion for smooth transitions and hover effects
- **Fonts**: Playfair Display (serif, headings) and DM Sans (sans-serif, body text)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express 5 running on Node.js with TypeScript (via tsx)
- **API Pattern**: RESTful JSON API. Routes defined in `server/routes.ts`, with a shared API contract in `shared/routes.ts` using Zod schemas
- **Database**: PostgreSQL via `pg` Pool, with Drizzle ORM for queries and schema definition
- **Schema Management**: Drizzle Kit with `db:push` command (no migration files committed — uses push workflow)
- **Data Seeding**: Auto-seeds product data on server startup if the products table is empty (in `server/routes.ts`)
- **Static Serving**: In production, serves built Vite output from `dist/public`. In development, uses Vite dev server middleware with HMR.

### Shared Layer (`shared/`)
- **`shared/schema.ts`**: Drizzle table definitions and Zod schemas (using `drizzle-zod`). Single table: `products` with fields for name, price, type, metal, stone, imageUrl, secondaryImageUrl, isNew.
- **`shared/routes.ts`**: API contract definitions with paths, HTTP methods, Zod input/output schemas. Used by both frontend hooks and backend route handlers.

### Key Pages
- **Home** (`/` and `/shop`): Product grid with category filtering (All, Rings, Necklaces, Earrings) and sort options. Includes a lifestyle/editorial card mixed into the grid.
- **Product Detail** (`/product/:id`): Single product view with image, pricing, quantity selector.
- **Not Found**: 404 fallback page.

### Build Process
- **Development**: `npm run dev` — runs tsx with Vite dev middleware
- **Production Build**: `npm run build` — Vite builds the client to `dist/public`, esbuild bundles the server to `dist/index.cjs`
- **Production Start**: `npm start` — runs the bundled server

### Database Schema
Single table currently:
- **products**: id (serial PK), name (text), price (decimal), type (text), metal (text), stone (text, nullable), imageUrl (text), secondaryImageUrl (text, nullable), isNew (boolean, default false)

### API Endpoints
- `GET /api/products` — List products with optional query params: type, metal, stone, sort (price_asc, price_desc, newest)
- `GET /api/products/:id` — Get single product by ID

## External Dependencies

- **PostgreSQL**: Required. Connection via `DATABASE_URL` environment variable. Used with `pg` driver and Drizzle ORM.
- **Drizzle Kit**: Schema management tool, configured in `drizzle.config.ts`. Run `npm run db:push` to sync schema to database.
- **Unsplash**: Product and lifestyle images are loaded from Unsplash CDN URLs (no API key needed, just direct image links).
- **Google Fonts**: Playfair Display and DM Sans loaded via Google Fonts CDN in `client/index.html` and `client/src/index.css`.
- **Replit Plugins** (dev only): `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` — loaded conditionally when running on Replit in development.