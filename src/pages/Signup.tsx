import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { COUNTRY_OPTIONS, getCountryByCode } from "../constants/countryOptions";
import { supabase } from "../supabaseClient";
import { PASSWORD_RULES, getPasswordIssues } from "../utils/passwordRules";

type StatusMessage = {
  type: "idle" | "loading" | "success" | "error";
  text?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClasses =
  "mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/40 transition";
const selectClasses =
  "mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3 text-white focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/40";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(COUNTRY_OPTIONS[0].code);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<StatusMessage>({ type: "idle" });

  const validatePhone = (value: string, countryCode: string) => {
    if (/[^0-9]/.test(value)) {
      return { isValid: false, message: "Use apenas números para o telefone." };
    }
    const cleaned = value.replace(/[^\d]/g, "");
    if (cleaned.length === 0) {
      return { isValid: true, formatted: "" };
    }
    if (cleaned.length < 8 || cleaned.length > 15) {
      return { isValid: false, message: "Informe entre 8 e 15 dígitos." };
    }
    const country = getCountryByCode(countryCode);
    return { isValid: true, formatted: `${country.dialCode} ${cleaned}` };
  };

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);
  const confirmPasswordMismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [password, confirmPassword]
  );
  const emailIsValid = useMemo(() => (email.length === 0 ? false : EMAIL_REGEX.test(email.toLowerCase())), [email]);
  const phoneValidation = useMemo(() => validatePhone(phone, phoneCountry), [phone, phoneCountry]);

  const blockingReason = useMemo(() => {
    if (!firstName || !lastName || !birthdate || !email || !password || !confirmPassword) {
      return "Preencha todos os campos obrigatórios.";
    }
    if (!emailIsValid) {
      return "Revise o formato do email.";
    }
    if (passwordIssues.length > 0) {
      return "A senha ainda não atende aos critérios.";
    }
    if (confirmPasswordMismatch) {
      return "As senhas precisam ser iguais.";
    }
    if (!phoneValidation.isValid) {
      return phoneValidation.message || "Revise o telefone informado.";
    }
    return null;
  }, [
    firstName,
    lastName,
    birthdate,
    email,
    password,
    confirmPassword,
    emailIsValid,
    passwordIssues,
    confirmPasswordMismatch,
    phoneValidation
  ]);

  const canSubmit =
    Boolean(
      firstName &&
        lastName &&
        birthdate &&
        email &&
        password &&
        confirmPassword &&
        passwordIssues.length === 0 &&
        !confirmPasswordMismatch &&
        emailIsValid &&
        phoneValidation.isValid
    ) && status.type !== "loading";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "loading", text: "Criando conta..." });

    if (passwordIssues.length > 0) {
      setStatus({
        type: "error",
        text: `A senha deve conter ${passwordIssues.join(", ")}.`
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        type: "error",
        text: "As senhas não coincidem."
      });
      return;
    }

    if (!emailIsValid) {
      setStatus({
        type: "error",
        text: "Informe um email válido."
      });
      return;
    }

    if (!phoneValidation.isValid) {
      setStatus({
        type: "error",
        text: phoneValidation.message
      });
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          birthdate,
          has_access: false,
          license_valid_until: null,
          phone: phoneValidation.formatted || null,
          phone_country: phoneCountry
        }
      }
    });

    if (authError) {
      setStatus({ type: "error", text: authError.message });
      return;
    }

    console.info("[signup] created user", authData.user?.id);

    setStatus({
      type: "success",
      text: "Conta criada! Verifique seu email e fale com nosso time no WhatsApp para ativar o acesso."
    });

    setFirstName("");
    setLastName("");
    setBirthdate("");
    setPhone("");
    setPhoneCountry(COUNTRY_OPTIONS[0].code);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-300/80">Solicitar acesso</p>
          <h1 className="text-3xl font-semibold text-white">Cadastrar</h1>
          <p className="mt-2 text-sm text-slate-300">
            Já possui conta? {""}
            <Link className="text-orange-200 hover:text-orange-100" to="/login">
              Entre
            </Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Nome</span>
            <input
              className={inputClasses}
              type="text"
              placeholder="Seu nome"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Sobrenome</span>
            <input
              className={inputClasses}
              type="text"
              placeholder="Seu sobrenome"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Data de nascimento</span>
            <input
              className={inputClasses}
              type="date"
              value={birthdate}
              onChange={(event) => setBirthdate(event.target.value)}
              required
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-1">
              <span className="text-sm font-medium text-slate-200">País</span>
              <select value={phoneCountry} onChange={(event) => setPhoneCountry(event.target.value)} className={selectClasses}>
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-span-2">
              <span className="text-sm font-medium text-slate-200">Telefone</span>
              <input
                className={inputClasses}
                type="tel"
                placeholder="(apenas números)"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
          </div>
          {!phoneValidation.isValid && phone.length > 0 && <p className="text-sm text-red-400">{phoneValidation.message}</p>}

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

          <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 text-xs text-slate-300">
            <p className="font-semibold mb-2 text-white">Sua senha deve conter:</p>
            <ul className="space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const isMet = !passwordIssues.includes(rule.label);
                return (
                  <li key={rule.id} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${isMet ? "bg-emerald-400" : "bg-slate-600"}`} />
                    <span className={isMet ? "text-emerald-400" : "text-slate-400"}>{rule.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Confirmar senha</span>
            <input
              className={inputClasses}
              type="password"
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          {confirmPasswordMismatch && <p className="text-sm text-red-400">As senhas precisam ser iguais.</p>}

          <button
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-4 py-3 text-slate-950 font-semibold shadow-lg transition hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={!canSubmit}
          >
            {status.type === "loading" ? "Criando conta..." : "Cadastrar"}
          </button>
        </form>

        {blockingReason && <p className="text-sm text-orange-200">{blockingReason}</p>}

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

export default SignupPage;
