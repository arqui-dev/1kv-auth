# 1kv-auth

Simple web application for user login and registration using React, Vite, Tailwind CSS, and Supabase.

## Prerequisites
- Node.js 18+
- Supabase account with an existing project

## Environment variables
Create a `.env.local` file at the project root with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Scripts
- `npm install` — install dependencies.
- `npm run dev` — start the development server.
- `npm run build` — generate the production build.
- `npm run preview` — preview the production build locally.

## Deployment
Deploy on Vercel and configure the same environment variables from `.env.local` in the project settings. The default build command is `npm run build`.
