import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

type StatusMessage = {
  type: "idle" | "loading" | "success" | "error";
  text?: string;
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<StatusMessage>({ type: "idle" });
  const navigate = useNavigate();

  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const redirectUri = queryParams.get("redirect_uri");
  const handshakeState = queryParams.get("state");
  const isDesktopFlow = Boolean(redirectUri && handshakeState);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "loading", text: "Entrando..." });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setStatus({ type: "error", text: error.message });
      return;
    }

    if (redirectUri && handshakeState) {
      const session = data.session;
      if (!session) {
        setStatus({
          type: "error",
          text: "Não foi possível recuperar a sessão do Supabase. Tente novamente."
        });
        return;
      }

      setStatus({
        type: "loading",
        text: "Conectando com o aplicativo..."
      });

      const payload = {
        state: handshakeState,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at ?? null,
        expires_in: session.expires_in ?? null,
        token_type: session.token_type,
        user: session.user
      };

      try {
        const response = await fetch(redirectUri, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(errorBody || "Falha ao entregar sessão para o aplicativo.");
        }

        setStatus({
          type: "success",
          text: "Login concluído. Retorne ao aplicativo desktop para continuar."
        });
        setPassword("");
        return;
      } catch (handshakeError) {
        const message =
          handshakeError instanceof Error
            ? handshakeError.message
            : "Erro inesperado ao enviar a sessão para o aplicativo.";
        setStatus({ type: "error", text: message });
        return;
      }
    }

    setStatus({ type: "success", text: "Login realizado com sucesso!" });

    // Redirect to success page after short delay
    setTimeout(() => {
      navigate("/success");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ainda não tem conta?{" "}
          <Link className="text-blue-600 hover:underline" to="/signup">
            Cadastre-se
          </Link>
        </p>
        {isDesktopFlow && (
          <p className="mt-2 text-sm text-slate-500">
            Após a autenticação, a sessão será enviada automaticamente para o
            aplicativo desktop.
          </p>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Senha</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={status.type === "loading"}
          >
            {status.type === "loading" ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {status.type !== "idle" && (
          <p
            className={`mt-4 text-sm ${
              status.type === "error"
                ? "text-red-600"
                : status.type === "success"
                ? "text-green-600"
                : "text-slate-600"
            }`}
          >
            {status.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
