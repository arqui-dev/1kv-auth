import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { COUNTRY_OPTIONS, detectCountryByDialCode, getCountryByCode } from "../constants/countryOptions";
import { supabase } from "../supabaseClient";

type StatusMessage = {
  type: "idle" | "loading" | "success" | "error";
  text?: string;
};

type ProfileData = {
  first_name: string | null;
  last_name: string | null;
  birthdate: string | null;
  has_access: boolean | null;
  license_valid_until: string | null;
  phone: string | null;
};

const SignedPage = () => {
  const [status, setStatus] = useState<StatusMessage>({
    type: "loading",
    text: "Carregando informações..."
  });
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    birthdate: "",
    phone: "",
    phoneCountry: COUNTRY_OPTIONS[0].code
  });
  const navigate = useNavigate();

  const formattedName = useMemo(() => {
    if (!profile) return "—";
    return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";
  }, [profile]);

  const formattedBirthdate = useMemo(() => {
    if (!profile?.birthdate) return "—";
    return new Date(profile.birthdate).toLocaleDateString("pt-BR");
  }, [profile]);

  const formattedLicense = useMemo(() => {
    if (!profile?.license_valid_until) return "—";
    return new Date(profile.license_valid_until).toLocaleDateString("pt-BR");
  }, [profile]);

  const formattedPhone = useMemo(() => {
    if (!profile?.phone) return "—";
    return profile.phone;
  }, [profile]);

  const licenseIsActive = useMemo(() => {
    if (!profile?.has_access) return false;
    if (!profile.license_valid_until) return false;
    return new Date(profile.license_valid_until) >= new Date();
  }, [profile]);

  const splitPhoneValue = (phoneValue: string | null) => {
    const detectedCountry = detectCountryByDialCode(phoneValue);
    if (!phoneValue) {
      return { phoneCountry: detectedCountry.code, phone: "" };
    }
    const numberOnly = phoneValue.replace(detectedCountry.dialCode, "").trim().replace(/[^\d]/g, "");
    return {
      phoneCountry: detectedCountry.code,
      phone: numberOnly
    };
  };

  const loadProfile = async () => {
    setStatus({ type: "loading", text: "Carregando informações..." });

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      setStatus({
        type: "error",
        text: error?.message || "Você precisa estar autenticado para acessar esta página."
      });
      return;
    }

    setUserEmail(user.email ?? "");
    setUserId(user.id);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("first_name,last_name,birthdate,has_access,license_valid_until,phone")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      setStatus({ type: "error", text: profileError.message });
      return;
    }

    if (profileData) {
      setProfile(profileData);
      setFormValues({
        firstName: profileData.first_name ?? "",
        lastName: profileData.last_name ?? "",
        birthdate: profileData.birthdate ?? "",
        ...splitPhoneValue(profileData.phone)
      });
    } else {
      const fallbackProfile = {
        first_name: (user.user_metadata.first_name as string) ?? null,
        last_name: (user.user_metadata.last_name as string) ?? null,
        birthdate: (user.user_metadata.birthdate as string) ?? null,
        has_access: (user.user_metadata.has_access as boolean) ?? null,
        license_valid_until: (user.user_metadata.license_valid_until as string) ?? null,
        phone: (user.user_metadata.phone as string) ?? null
      };
      setProfile(fallbackProfile);
      setFormValues({
        firstName: fallbackProfile.first_name ?? "",
        lastName: fallbackProfile.last_name ?? "",
        birthdate: fallbackProfile.birthdate ?? "",
        ...splitPhoneValue(fallbackProfile.phone)
      });
    }

    setStatus({ type: "success", text: "Dados carregados com sucesso." });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = async () => {
    setStatus({ type: "loading", text: "Saindo..." });
    await supabase.auth.signOut();
    setStatus({ type: "success", text: "Sessão encerrada." });
    navigate("/login");
  };

  const handleEditToggle = () => {
    if (!profile) return;
    setFormValues({
      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
      birthdate: profile.birthdate ?? "",
      ...splitPhoneValue(profile.phone)
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    if (!profile) return;
    setFormValues({
      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
      birthdate: profile.birthdate ?? "",
      ...splitPhoneValue(profile.phone)
    });
    setIsEditing(false);
  };

  const handleFormChange =
    (field: "firstName" | "lastName" | "birthdate" | "phone") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: event.target.value
      }));
    };

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCountry = event.target.value;
    setFormValues((prev) => ({
      ...prev,
      phoneCountry: nextCountry
    }));
  };

  const validatePhoneBeforeSave = (value: string, countryCode: string) => {
    const cleaned = value.replace(/[^\d]/g, "");
    if (cleaned.length === 0) {
      return { isValid: true, formatted: "" };
    }
    if (cleaned.length < 8 || cleaned.length > 15) {
      return { isValid: false, message: "Informe entre 8 e 15 dígitos para o telefone." };
    }
    const country = getCountryByCode(countryCode);
    return { isValid: true, formatted: `${country.dialCode} ${cleaned}` };
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    setStatus({ type: "loading", text: "Atualizando dados..." });

    const phoneValidation = validatePhoneBeforeSave(formValues.phone, formValues.phoneCountry);
    if (!phoneValidation.isValid) {
      setStatus({ type: "error", text: phoneValidation.message });
      return;
    }

    const updatePayload = {
      first_name: formValues.firstName,
      last_name: formValues.lastName,
      birthdate: formValues.birthdate,
      phone: phoneValidation.formatted || null
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    if (profileError) {
      setStatus({ type: "error", text: profileError.message });
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        birthdate: formValues.birthdate,
        phone: phoneValidation.formatted || null,
        phone_country: formValues.phoneCountry
      }
    });

    if (metadataError) {
      setStatus({ type: "error", text: metadataError.message });
      return;
    }

    setStatus({ type: "success", text: "Dados atualizados com sucesso." });
    setIsEditing(false);
    await loadProfile();
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Informações do usuário</h1>
            <p className="text-sm text-slate-600">Veja seus dados e o status da licença.</p>
          </div>
          <button
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            onClick={loadProfile}
            disabled={status.type === "loading"}
          >
            Atualizar
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Mantenha seus dados atualizados para suporte rápido.</p>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            onClick={handleEditToggle}
            disabled={status.type === "loading"}
          >
            Editar informações
          </button>
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-6 text-sm text-slate-700 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <dt className="font-medium text-slate-500">Nome</dt>
            <dd className="text-base text-slate-900">{formattedName}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <dt className="font-medium text-slate-500">Email</dt>
            <dd className="text-base text-slate-900 break-all">{userEmail || "—"}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <dt className="font-medium text-slate-500">Data de nascimento</dt>
            <dd className="text-base text-slate-900">{formattedBirthdate}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <dt className="font-medium text-slate-500">Licença válida até</dt>
            <dd className="text-base text-slate-900">{formattedLicense}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <dt className="font-medium text-slate-500">Telefone</dt>
            <dd className="text-base text-slate-900">{formattedPhone}</dd>
          </div>
        </dl>

        <div className="mt-8 rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-500">Status de acesso</p>
          <p
            className={`mt-2 text-lg font-semibold ${
              licenseIsActive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {licenseIsActive ? "Licença ativa" : "Sem licença ativa"}
          </p>
          {profile?.license_valid_until && (
            <p className="text-sm text-slate-600">
              Vigência até {formattedLicense}. {licenseIsActive ? "" : "Renove para continuar."}
            </p>
          )}
        </div>

        {isEditing && (
          <form className="mt-8 space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-6" onSubmit={handleProfileSave}>
            <h2 className="text-lg font-semibold text-slate-900">Atualizar dados pessoais</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Nome
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  type="text"
                  value={formValues.firstName}
                  onChange={handleFormChange("firstName")}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Sobrenome
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  type="text"
                  value={formValues.lastName}
                  onChange={handleFormChange("lastName")}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Data de nascimento
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  type="date"
                  value={formValues.birthdate}
                  onChange={handleFormChange("birthdate")}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Telefone (opcional)
                <div className="mt-1 grid grid-cols-[140px_1fr] gap-3">
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={formValues.phoneCountry}
                    onChange={handleCountryChange}
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="tel"
                    value={formValues.phone}
                    onChange={handleFormChange("phone")}
                    placeholder="11999990000"
                  />
                </div>
              </label>
            </div>
            <div className="flex flex-col gap-3 text-sm font-semibold sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-white"
                onClick={handleEditCancel}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={status.type === "loading"}
              >
                Salvar alterações
              </button>
            </div>
          </form>
        )}

        <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link className="text-sm text-blue-600 hover:underline" to="/login">
            Voltar para o login
          </Link>
          <button
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white font-semibold transition hover:bg-slate-800 md:w-auto"
            onClick={handleLogout}
            disabled={status.type === "loading"}
          >
            Sair
          </button>
        </div>

        {status.type !== "idle" && (
          <p
            className={`mt-6 text-sm ${
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

export default SignedPage;
