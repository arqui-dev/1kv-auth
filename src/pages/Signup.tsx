import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { COUNTRY_OPTIONS, getCountryByCode } from "../constants/countryOptions";
import { supabase } from "../supabaseClient";

type StatusMessage = {
  type: "idle" | "loading" | "success" | "error";
  text?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "Mínimo de 10 caracteres", test: (value) => value.length >= 10 },
  { id: "uppercase", label: "Pelo menos uma letra maiúscula", test: (value) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "Pelo menos uma letra minúscula", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "Pelo menos um número", test: (value) => /[0-9]/.test(value) },
  {
    id: "special",
    label: "Pelo menos um caractere especial",
    test: (value) => /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\\/]/.test(value)
  },
  { id: "whitespace", label: "Sem espaços em branco", test: (value) => !/\s/.test(value) }
];

const getPasswordIssues = (value: string) =>
  PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label);

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

    setStatus({
      type: "success",
      text: "Conta criada! Verifique seu email para confirmar o cadastro."
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Cadastrar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Já possui conta?{" "}
          <Link className="text-blue-600 hover:underline" to="/login">
            Entre
          </Link>
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="text"
              placeholder="Seu nome"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Sobrenome</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="text"
              placeholder="Seu sobrenome"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Data de nascimento</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="date"
              value={birthdate}
              onChange={(event) => setBirthdate(event.target.value)}
              required
            />
          </label>

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
        {email.length > 0 && (
          <p className={`mt-1 text-xs ${emailIsValid ? "text-emerald-600" : "text-red-600"}`}>
            {emailIsValid ? "Formato de email válido." : "Formato de email inválido."}
          </p>
        )}
      </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Senha</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="password"
              placeholder="Crie uma senha segura"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <ul className="mt-2 space-y-1 text-xs">
              {PASSWORD_RULES.map((rule) => {
                const isMet = rule.test(password);
                return (
                  <li
                    key={rule.id}
                    className={`flex items-center gap-2 ${isMet ? "text-emerald-600" : "text-slate-500"}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${isMet ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Confirmar senha</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="password"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            {confirmPassword.length > 0 && (
              <p className={`mt-1 text-xs ${confirmPasswordMismatch ? "text-red-600" : "text-emerald-600"}`}>
                {confirmPasswordMismatch ? "As senhas não coincidem." : "As senhas conferem."}
              </p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Telefone (opcional)</span>
            <div className="mt-1 grid grid-cols-[140px_1fr] gap-3">
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={phoneCountry}
                onChange={(event) => setPhoneCountry(event.target.value)}
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                type="tel"
                placeholder="11999990000"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            {phone.length > 0 && (
              <p className={`mt-1 text-xs ${phoneValidation.isValid ? "text-emerald-600" : "text-red-600"}`}>
                {phoneValidation.isValid
                  ? "Formato de telefone válido."
                  : phoneValidation.message || "Telefone inválido."}
              </p>
            )}
          </label>

          <button
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={!canSubmit}
          >
            {status.type === "loading" ? "Cadastrando..." : "Cadastrar"}
          </button>
          {!canSubmit && blockingReason && (
            <p className="text-xs font-medium text-red-600">{blockingReason}</p>
          )}
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

export default SignupPage;
