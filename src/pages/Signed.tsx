import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import SubscriptionStatus from "../components/SubscriptionStatus";
import AccessGate from "../components/AccessGate";
import EmptyStateUpgrade from "../components/EmptyStateUpgrade";
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

  const licenseStatusText = useMemo(
    () => (licenseIsActive ? "Licença ativa" : "Sem licença ativa"),
    [licenseIsActive]
  );

  const userInitials = useMemo(() => {
    if (!profile) return "1K";
    const first = profile.first_name?.[0] ?? "";
    const last = profile.last_name?.[0] ?? "";
    const initials = `${first}${last}`.trim().toUpperCase();
    return initials || "1K";
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
    <AuthLayout contentWidth="wide">
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-300/80">Área autenticada</p>
            <h1 className="text-2xl font-semibold text-white">Perfil e licença</h1>
            <p className="text-sm text-slate-300">Confira seus dados pessoais e o status da sua licença.</p>
          </div>
          <button
            className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
            onClick={loadProfile}
            disabled={status.type === "loading"}
          >
            Atualizar dados
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-300 text-xl font-semibold text-slate-950">
                {userInitials}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{formattedName}</p>
                <p className="text-sm text-slate-300">{userEmail || "—"}</p>
                <p className={`text-sm ${licenseIsActive ? "text-emerald-300" : "text-red-400"}`}>{licenseStatusText}</p>
              </div>
            </div>
            <button
              className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg transition hover:scale-[1.01] disabled:opacity-60"
              onClick={handleEditToggle}
              disabled={status.type === "loading"}
            >
              Alterar cadastro
            </button>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <dt className="font-medium text-slate-400">Data de nascimento</dt>
              <dd className="text-base text-white">{formattedBirthdate}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <dt className="font-medium text-slate-400">Telefone</dt>
              <dd className="text-base text-white">{formattedPhone}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <dt className="font-medium text-slate-400">Licença válida até</dt>
              <dd className="text-base text-white">{formattedLicense}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          <p className="text-sm font-medium text-slate-300">Status de acesso</p>
          <p className={`mt-2 text-lg font-semibold ${licenseIsActive ? "text-emerald-300" : "text-red-400"}`}>
            {licenseIsActive ? "Licença ativa" : "Sem licença ativa"}
          </p>
          {profile?.license_valid_until && (
            <p className="text-sm text-slate-400">
              Vigência até {formattedLicense}. {licenseIsActive ? "" : "Renove para continuar."}
            </p>
          )}
        </div>

        <SubscriptionStatus />

        <AccessGate
          productSlug="1kv_videos"
          fallback={
            <EmptyStateUpgrade
              productSlug="1kv_videos"
              title="Libere o gerador de vídeos"
              description="Faça upgrade para executar as automações no desktop. Você pode navegar normalmente, mas a execução fica bloqueada."
            />
          }
        >
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-900/20 p-6 text-white shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Acesso liberado</p>
            <h3 className="text-2xl font-semibold text-white">Gerador de vídeos habilitado</h3>
            <p className="mt-2 text-sm text-emerald-100">
              Sua conta já tem permissão para usar o 1kvideos desktop. Abra o app e continue de onde parou.
            </p>
          </div>
        </AccessGate>

        {isEditing && (
          <form className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg" onSubmit={handleProfileSave}>
            <h2 className="text-lg font-semibold text-white">Atualizar dados pessoais</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-300">
                Nome
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3 text-white focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/40"
                  type="text"
                  value={formValues.firstName}
                  onChange={handleFormChange("firstName")}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-300">
                Sobrenome
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3 text-white focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/40"
                  type="text"
                  value={formValues.lastName}
                  onChange={handleFormChange("lastName")}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-300">
                Data de nascimento
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3 text-white focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/40"
                  type="date"
                  value={formValues.birthdate}
                  onChange={handleFormChange("birthdate")}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-300">
                Telefone (opcional)
                <div className="mt-1 grid grid-cols-[140px_1fr] gap-3">
                  <select
                    className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3 text-white focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/40"
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
                    className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3 text-white focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/40"
                    type="tel"
                    value={formValues.phone}
                    onChange={handleFormChange("phone")}
                    placeholder="11999990000"
                  />
                </div>
              </label>
            </div>
            <div className="flex flex-col gap-3 text-sm font-semibold text-white sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-2xl border border-white/20 px-4 py-2 text-slate-200 hover:bg-white/5"
                onClick={handleEditCancel}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                disabled={status.type === "loading"}
              >
                Salvar alterações
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link className="text-sm font-semibold text-orange-200 hover:text-orange-100" to="/login">
            Voltar para o login
          </Link>
          <button
            className="w-full rounded-2xl border border-white/15 px-4 py-2 text-white font-semibold transition hover:bg-white/10 md:w-auto"
            onClick={handleLogout}
            disabled={status.type === "loading"}
          >
            Sair
          </button>
        </div>

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

export default SignedPage;
