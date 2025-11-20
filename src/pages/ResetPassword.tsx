import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { supabase } from "../supabaseClient";
import { PASSWORD_RULES, getPasswordIssues } from "../utils/passwordRules";

type StatusMessage = {
  type: "idle" | "loading" | "success" | "error";
  text?: string;
};

const inputClasses =
  "mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/40 transition";

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<StatusMessage>({ type: "idle" });
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordIssues = useMemo(() => getPasswordIssues(newPassword), [newPassword]);
  const confirmPasswordMismatch = useMemo(
    () => confirmPassword.length > 0 && newPassword !== confirmPassword,
    [newPassword, confirmPassword]
  );
  const canSaveNewPassword =
    Boolean(
      newPassword &&
        confirmPassword &&
        passwordIssues.length === 0 &&
        !confirmPasswordMismatch
    ) && status.type !== "loading";

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

    if (passwordIssues.length > 0) {
      setStatus({
        type: "error",
        text: `A senha deve conter ${passwordIssues.join(", ")}.`
      });
      return;
    }

    if (confirmPasswordMismatch) {
      setStatus({
        type: "error",
        text: "As senhas não coincidem."
      });
      return;
    }

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

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setStatus({ type: "error", text: error.message });
      return;
    }

    setStatus({
      type: "success",
      text: "Senha alterada com sucesso! Agora você já pode fazer login novamente."
    });
    setNewPassword("");
    setConfirmPassword("");
    setIsRecoveryFlow(false);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-300/80">Recuperar acesso</p>
          <h1 className="text-3xl font-semibold text-white">Recuperar senha</h1>
          <p className="mt-2 text-sm text-slate-300">
            Já lembrou a senha? {""}
            <Link className="text-orange-200 hover:text-orange-100" to="/login">
              Voltar para o login
            </Link>
          </p>
        </div>

        <form className="space-y-4" onSubmit={requestResetLink}>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Email cadastrado</span>
            <input
              className={inputClasses}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <button
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-4 py-3 text-slate-950 font-semibold shadow-lg transition hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={status.type === "loading"}
          >
            {status.type === "loading" ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        {isRecoveryFlow && (
          <form className="space-y-4 border-t border-white/5 pt-6" onSubmit={handlePasswordUpdate}>
            <p className="text-sm text-slate-300">
              Recebemos o token de recuperação. Informe e confirme uma nova senha abaixo.
            </p>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Nova senha</span>
              <input
                className={inputClasses}
                type="password"
                placeholder="Digite uma nova senha segura"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Confirmar senha</span>
              <input
                className={inputClasses}
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              {confirmPassword.length > 0 && (
                <p className={`mt-1 text-xs ${confirmPasswordMismatch ? "text-red-400" : "text-emerald-300"}`}>
                  {confirmPasswordMismatch ? "As senhas não coincidem." : "As senhas conferem."}
                </p>
              )}
            </label>

            <ul className="space-y-1 rounded-2xl border border-white/5 bg-slate-900/50 p-3 text-xs text-slate-300">
              {PASSWORD_RULES.map((rule) => {
                const isMet = rule.test(newPassword);
                return (
                  <li
                    key={rule.id}
                    className={`flex items-center gap-2 ${isMet ? "text-emerald-400" : "text-slate-500"}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${isMet ? "bg-emerald-400" : "bg-slate-600"}`} />
                    {rule.label}
                  </li>
                );
              })}
            </ul>

            <button
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-4 py-3 text-slate-950 font-semibold shadow-lg transition hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={!canSaveNewPassword}
            >
              {status.type === "loading" ? "Atualizando senha..." : "Salvar nova senha"}
            </button>
          </form>
        )}

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

export default ResetPasswordPage;
