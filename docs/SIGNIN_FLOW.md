# Fluxo de autenticação 1kvideos

Diagrama resumindo as etapas de cadastro, login, recuperação e sincronização com o app desktop.

```mermaid
flowchart TD
  A[Visita /signup] --> B{Formulario válido?}
  B -- Não --> B1[Feedback em tempo real]
  B -- Sim --> C[Supabase auth.signUp]
  C --> D[Trigger cria linha em public.profiles]
  D --> E{Confirma email?}
  E -- Sim --> F[Usuário pronto para login]
  E -- Não --> A

  F --> G[Visita /login]
  G --> H{Credenciais válidas?}
  H -- Não --> H1[Mensagem de erro]
  H -- Sim --> I[Supabase retorna sessão]
  I --> J{Query contém redirect_uri?}
  J -- Sim --> K[POST sessão para app desktop]
  J -- Não --> L[/signed exibe dados + botão Alterar cadastro]
  L --> M[Usuário atualiza perfil]
  M --> N[profiles + auth.user_metadata sincronizados]

  H1 --> O{Esqueceu senha?}
  O -- Sim --> P[/reset-password]
  P --> Q[Supabase envia email com link]
  Q --> R[Usuário abre link]
  R --> S{Nova senha atende regras?}
  S -- Não --> S1[Feedback das regras]
  S -- Sim --> T[auth.updateUser salva nova senha]
  T --> G
```

- **Desktop handshake:** quando `redirect_uri` e `state` estão presentes, o front envia o token ao app desktop antes de finalizar o fluxo web.
- **Área autenticada:** `/signed` mostra nome, email, telefone, status da licença e oferece o botão “Alterar cadastro”, que habilita o formulário inline.
- **Recuperação de senha:** a página `/reset-password` cobre desde o pedido do email até a definição da nova senha com as mesmas validações OWASP usadas no cadastro.
```
