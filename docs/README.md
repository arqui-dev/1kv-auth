# Project Documentation

## Overview
This project implements a minimal authentication UI that satisfies the initial requirements captured in `docs/CONTEXT.md`. It delivers login and sign-up screens built with React (TypeScript), Vite, Tailwind CSS, and Supabase authentication.

## Stack Summary
- **Frontend framework:** React 18 with TypeScript
- **Build tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Authentication:** Supabase (hosted backend)
- **Routing:** `react-router-dom` for `/login`, `/signup`, and redirect from `/`

## Implementation Notes
- `src/supabaseClient.ts` initializes the Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` so credentials never live in the repository.
- `src/pages/Login.tsx` and `src/pages/Signup.tsx` provide forms that call `supabase.auth.signInWithPassword` and `supabase.auth.signUp` respectively, surfacing success, error, and loading states to the user.
- `src/router.tsx` configures client-side navigation and default redirect behavior.
- Tailwind is wired through `tailwind.config.js`, `postcss.config.js`, and `src/index.css`.

## Getting the App Running
1. Install dependencies: `npm install`.
2. Create `.env.local` (ignored by Git) with:
   ```
   VITE_SUPABASE_URL=<https://your-project.supabase.co>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```
3. Start the development server: `npm run dev`.
4. For production builds (e.g., Vercel), run `npm run build`. Vercel’s default settings understand Vite projects; just mirror the environment variables in the project settings.

## Additional Context
- The app assumes Supabase email/password authentication is enabled. Other Supabase flows (magic links, OAuth) can be added later.
- HTTPS should be enforced in production (Vercel does this automatically) to ensure credentials remain encrypted in transit.
