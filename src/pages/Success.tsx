import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const SuccessPage = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    // This will attempt to trigger the desktop app if it has a custom protocol
    // For now, just show a message
    alert("Se o aplicativo desktop estiver instalado, ele será aberto automaticamente.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
          Login Realizado!
        </h1>
        <p className="text-center text-slate-600 mb-6">
          Você está autenticado com sucesso.
        </p>

        {/* User Info */}
        {userEmail && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600 mb-1">Conectado como:</p>
            <p className="font-semibold text-slate-900">{userEmail}</p>
          </div>
        )}

        {/* Desktop App Notice */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-indigo-900 mb-1">
                Aplicativo Desktop
              </p>
              <p className="text-sm text-indigo-700">
                Se você veio do aplicativo desktop, pode fechar esta janela e
                retornar ao aplicativo. Sua sessão foi enviada automaticamente!
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleOpenDesktopApp}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white font-semibold transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            Abrir Aplicativo Desktop
          </button>

          <Link
            to="/login"
            className="block w-full text-center rounded-lg border border-slate-300 px-4 py-3 text-slate-700 font-semibold transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Voltar ao Login
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full rounded-lg border border-red-300 px-4 py-3 text-red-600 font-semibold transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            Sair
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-center text-slate-500">
            Esta página confirma que você está autenticado.
            <br />
            Use o aplicativo desktop para acessar todas as funcionalidades.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
