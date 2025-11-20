import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { supabase } from "../supabaseClient";

const SuccessPage = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleOpenDesktopApp = () => {
    alert("Se o aplicativo desktop estiver instalado, ele será aberto automaticamente.");
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="text-center text-slate-300">Carregando...</div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-white">Login realizado!</h1>
          <p className="text-slate-300">Sua sessão está sincronizada com o app desktop.</p>
        </div>

        {userEmail && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-300">Conectado como:</p>
            <p className="text-lg font-semibold text-white">{userEmail}</p>
          </div>
        )}

        <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-sm text-orange-100">
          <p className="font-semibold text-orange-200">Aplicativo Desktop</p>
          <p>
            Se você veio do aplicativo desktop, pode fechar esta janela e retornar ao app. Sua sessão foi entregue
            automaticamente.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleOpenDesktopApp}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-4 py-3 text-slate-950 font-semibold shadow-lg transition hover:scale-[1.01]"
          >
            Abrir aplicativo
          </button>

          <Link
            to="/signed"
            className="block w-full rounded-2xl border border-white/15 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/5"
          >
            Minha área
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full rounded-2xl border border-red-400/40 px-4 py-3 text-red-200 font-semibold transition hover:bg-red-500/10"
          >
            Sair
          </button>
        </div>

        <p className="pt-4 text-center text-xs text-slate-400">
          Esta página confirma que você está autenticado.<br />Use o aplicativo desktop para acessar todas as
          funcionalidades.
        </p>
      </div>
    </AuthLayout>
  );
};

export default SuccessPage;
