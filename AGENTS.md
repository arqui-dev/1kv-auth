# Agent Playbook

This document helps future contributors—human or AI—work consistently within the `1kv-auth` project.

## Mission
- Maintain a secure and accessible authentication experience backed by Supabase.
- Keep the codebase idiomatic TypeScript and aligned with Vite + React best practices.
- Preserve deployability on Vercel with minimal manual intervention.

## Operating Principles
1. **Security first**: Treat credentials carefully, prefer HTTPS-only traffic, and avoid logging secrets.
2. **Clarity over cleverness**: Choose readable TypeScript with explicit types, lean components, and well-factored hooks.
3. **Incremental change**: Ship small, reversible updates and record them in the journaling system.
4. **Documentation parity**: Update `docs/` and journal entries whenever behavior or expectations change.

## TypeScript Guidelines
- Enable and respect `strict` compiler settings.
- Model Supabase data with explicit interfaces or `type` aliases; extend shared typings rather than re-declaring.
- Prefer function components with typed props and controlled form state.
- Use granular utility types to convey nullability or optional fields instead of `any`.

## Supabase Practices
- Keep keys and URLs in environment variables (`.env.local`, Vercel project settings).
- Prefer row-level security policies and Supabase auth events when adding backend logic.
- Use `supabase.auth` APIs with proper error handling and user feedback states.
- Refresh tokens/store sessions securely; never commit tokens or service keys.

## Desktop Auth Considerations
- If a desktop client consumes this API, rely on Supabase’s OAuth or PKCE flows instead of embedding service keys.
- Use deep links or secure custom URI schemes to return authentication results to the desktop app.
- Store credentials using the operating system’s secure storage (Keychain, Credential Manager, GNOME Keyring, etc.).
- Keep communication over HTTPS and validate certificates to avoid MITM risks.

## Vercel Deployment Tips
- Use the default Vite build command (`npm run build`) and `npm run preview` for local verification.
- Configure environment variables in Vercel’s dashboard, matching `.env.local`.
- Enable automatic HTTPS (default on Vercel) and verify redirects for protected routes.
- Monitor build logs; keep dependencies patched to prevent deployment warnings.

## Workflow Checklist
1. Sync with `main` and confirm a clean working tree.
2. Implement changes with attention to the practices above.
3. Run `npm run build` (and tests when available) before opening a PR.
4. Update documentation (`README.md`, `docs/`, journals) as necessary.
5. Summarize modifications succinctly in commits and PR descriptions.

Respect these guidelines to keep the project stable, secure, and transparent. When in doubt, document the question in `docs/Journal/` and surface it for review.
