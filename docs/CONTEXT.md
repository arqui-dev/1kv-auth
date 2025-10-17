# Initial Prompt

```
Create a simple web application for user login and registration with the following stack:

* **Framework:** React with TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Authentication:** Supabase

The application must include the following features and files:

1.  **`supabaseClient.ts`**: File to initialize and export the Supabase client. It must use environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
2.  **Login page (`/login`)**: A form with fields for “email” and “password” and an “Entrar” (Sign In) button. On submit, it should call `supabase.auth.signInWithPassword`.
3.  **Sign-up page (`/signup`)**: A form with fields for “email” and “password” and a “Cadastrar” (Sign Up) button. On submit, it should call `supabase.auth.signUp`.
4.  **Routing**: Use `react-router-dom` to manage the `/login` and `/signup` routes. The home page (`/`) can redirect to `/login`.
5.  **User feedback**: Display simple success, error, or loading messages during authentication operations.
6.  **Styling**: Use Tailwind CSS utility classes for a clean, functional layout—no complex design required.
7.  **Configuration**: Provide the contents for `package.json` (with required dependencies), `tailwind.config.js`, and `postcss.config.js`.

The application will be deployed on Vercel. Provide the complete code for each file.
```
