import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

type StatusMessage = {
  type: "idle" | "loading" | "success" | "error";
  text?: string;
};

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<StatusMessage>({ type: "idle" });
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const params = new URLSearchParams(hash);
    if (params.get("type") === "recovery") {
      setIsRecoveryFlow(true);
      setStatus({
        type: "idle",
        text: "Defina uma nova senha para concluir a recuperação."
      });
    }
  }, []);

  const requestResetLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "loading", text: "Enviando email de recuperação..." });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      setStatus({ type: "error", text: error.message });
      return;
    }

    setStatus({
      type: "success",
      text: "Email enviado! Verifique sua caixa de entrada para continuar."
    });
    setEmail("");
  };

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "loading", text: "Atualizando senha..." });

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      setStatus({
        type: "error",
        text: "Token de recuperação inválido ou expirado. Solicite um novo email."
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setStatus({ type: "error", text: error.message });
      return;
    }

    setStatus({
      type: "success",
      text: "Senha alterada com sucesso! Agora você já pode fazer login novamente."
    });
    setNewPassword("");
    setIsRecoveryFlow(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Recuperar senha</h1>
          <p className="mt-2 text-sm text-slate-600">
            Já lembrou a senha?{" "}
            <Link className="text-blue-600 hover:underline" to="/login">
              Voltar para o login
            </Link>
          </p>
        </div>

        <form className="space-y-4" onSubmit={requestResetLink}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email cadastrado</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <button
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={status.type === "loading"}
          >
            {status.type === "loading" ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        {isRecoveryFlow && (
          <form className="space-y-4 border-t border-slate-200 pt-6" onSubmit={handlePasswordUpdate}>
            <p className="text-sm text-slate-600">
              Recebemos o token de recuperação. Informe uma nova senha abaixo.
            </p>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nova senha</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                type="password"
                placeholder="Digite uma nova senha segura"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={6}
                required
              />
            </label>

            <button
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white font-semibold transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={status.type === "loading"}
            >
              {status.type === "loading" ? "Salvando..." : "Alterar senha"}
            </button>
          </form>
        )}

        {status.type !== "idle" && (
          <p
            className={`text-sm ${
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

export default ResetPasswordPage;
