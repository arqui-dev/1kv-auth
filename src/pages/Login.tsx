import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
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
  console.info("[DesktopAuth] Query params parsed", {
    isDesktopFlow,
    redirectUri,
    hasState: Boolean(handshakeState)
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "loading", text: "Entrando..." });
    console.info("[DesktopAuth] Form submitted. Desktop flow?", isDesktopFlow);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("[DesktopAuth] Supabase signInWithPassword failed", error);
      setStatus({ type: "error", text: error.message });
      return;
    }
    console.info("[DesktopAuth] Supabase signInWithPassword succeeded", {
      userId: data.user?.id,
      userEmail: data.user?.email
    });

    if (redirectUri && handshakeState) {
      const session = data.session;
      if (!session) {
        console.error("[DesktopAuth] Desktop flow detected but session missing");
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
      console.info("[DesktopAuth] Prepared payload for desktop app", {
        redirectUri,
        state: handshakeState,
        userEmail: session.user?.email,
        expires_at: session.expires_at
      });

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
          console.error("[DesktopAuth] Desktop callback returned non-OK", {
            status: response.status,
            errorBody
          });
          throw new Error(errorBody || "Falha ao entregar sessão para o aplicativo.");
        }

        console.info("[DesktopAuth] Session successfully delivered to desktop");
        setStatus({
          type: "success",
          text: "Login concluído. Retorne ao aplicativo desktop para continuar."
        });
        setPassword("");

        // Redirect to success page after short delay
        setTimeout(() => {
          navigate("/success");
        }, 1500);
        return;
      } catch (handshakeError) {
        console.error("[DesktopAuth] Error delivering session to desktop", handshakeError);
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
    console.info("[DesktopAuth] Web-only login completed.");
    navigate("/signed");
  };

  const inputClasses =
    "mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/40 transition";

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-300/80">Acesso seguro</p>
          <h1 className="text-3xl font-semibold text-white">Entrar</h1>
          <p className="mt-2 text-sm text-slate-300">
            Ainda não tem conta?{" "}
            <Link className="text-orange-300 hover:text-orange-200" to="/signup">
              Cadastre-se
            </Link>
          </p>
          {isDesktopFlow && (
            <p className="mt-2 text-sm text-slate-400">
              Após a autenticação, entregamos sua sessão automaticamente ao aplicativo desktop.
            </p>
          )}
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <input
              className={inputClasses}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Senha</span>
            <input
              className={inputClasses}
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <div className="text-right">
            <Link className="text-sm font-semibold text-orange-200 hover:text-orange-100" to="/reset-password">
              Esqueceu sua senha?
            </Link>
          </div>
          <button
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-4 py-3 text-slate-950 font-semibold shadow-lg transition hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={status.type === "loading"}
          >
            {status.type === "loading" ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {status.type !== "idle" && (
          <p
            className={`text-sm ${
              status.type === "error"
                ? "text-red-400"
                : status.type === "success"
                ? "text-emerald-300"
                : "text-orange-200"
            }`}
          >
            {status.text}
          </p>
        )}
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
