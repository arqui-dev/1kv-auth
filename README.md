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

## Fluxo de autenticação

1. **Usuário sem sessão**
   - Acessa a tela de login (`/login`).
   - Se tiver credenciais:
     1. Valida email/senha no Supabase.
     2. Ao autenticar, é redirecionado para `/signed`.
     3. Se houver `redirect_uri` e `state`, a sessão é entregue ao app desktop e o usuário é orientado a voltar ao 1kvideos desktop.
   - Se esqueceu a senha:
     1. Solicita email de recuperação na tela `/reset-password`.
     2. Recebe o link via email, acessa e define a nova senha.
     3. Ao salvar, volta à tela de login para entrar novamente.
2. **Usuário sem cadastro**
   - Vai para `/signup`.
   - Após preencher e confirmar o email, exibimos a mensagem “Conta criada! Verifique sua caixa de entrada e fale com nosso time no WhatsApp para ativar o acesso”. Hoje o processo comercial é manual; no futuro esse fluxo alimentará a compra automática.
