# Python Desktop Integration Notes

The desktop app under `1kv-python/` needs a few updates to consume the new web auth flow and profile data that now includes optional phone numbers.

## 1. Update Supabase credentials
- File: `1kv-python/supabase_client.py`
- Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` with the same values defined in `1kv-auth/.env` (currently `https://lnjqfautqugtwzxptjzr.supabase.co`).
- The client already refreshes tokens automatically, so no further changes to the HTTP layer are required.

## 2. Persist new metadata fields
- Wherever the desktop app reads `session['user']['user_metadata']`, expect the following keys to be present:
  - `first_name`
  - `last_name`
  - `birthdate`
  - `phone` (optional, already prefixed with the country dialing code)
  - `phone_country` (the ISO code selected in the dropdown)
  - `has_access`
  - `license_valid_until`
- Suggested updates:
  - `login_frame.py`: after `supabase_client.set_session(auth_data)`, store the metadata in memory so the UI can show the user’s name and whether the license is active.
  - `main_frame.py` (or whichever container gates premium features): read `has_access` and `license_valid_until` to allow/deny video automation. If the license is expired, block the workspace and prompt the user to renew in the web app.

## 3. Provide an “Update my data” shortcut
- `login_frame.py` already has `open_account()` which opens `WEB_AUTH_URL`. Make sure the `.env` for the desktop app (or system environment) sets `WEB_AUTH_URL=https://1kv-auth.vercel.app` so the new “Atualizar meus dados” experience is reachable.

## 4. Handle optional phone numbers
- When saving sessions (`utils.save_session`), keep the entire `user` payload so that subsequent launches know the phone number without re-fetching.
- If the desktop UI needs to display or edit the phone, extend the relevant widgets (e.g., a settings dialog) to read `user['user_metadata'].get('phone')` and show `"—"` when missing.

## 5. License-aware UX (optional but recommended)
- Use the metadata fields to show the license status inside the desktop UI. For example, on startup:
  1. `supabase_client.ensure_valid_session()`
  2. `user = supabase_client.get_user_info()`
  3. `meta = user.get('user_metadata', {})`
  4. Evaluate `meta.get('has_access')` and compare `meta.get('license_valid_until')` with today’s date.
- Surface a warning banner or disable export features if `has_access` is `False` or the expiration date is in the past.

These adjustments keep the Python client aligned with the richer profile data captured by the new signup/profile pages while continuing to use the same Supabase authentication flow.
