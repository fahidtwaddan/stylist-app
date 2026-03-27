# AI Stylist App

## Overview
Mobile-first PWA where users upload a photo, Claude Vision analyzes their style DNA, and they get curated outfits from GCC stores with affiliate links.

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand, Claude Vision API

## Architecture
7-screen flow: Landing → Analyzing → Style Profile → Occasion Selector → Outfit Grid → Try-On → Share/Referral

## Key Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint

## Environment
- Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`

## Conventions
- Mobile-first design (375px–428px primary)
- AED pricing for GCC market
- All API routes in `src/app/api/`
- Zustand store in `src/store/useStyleStore.ts`
- Shared types in `src/lib/types.ts`
