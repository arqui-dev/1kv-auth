export type CountryOption = {
  code: string;
  label: string;
  dialCode: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "BR", label: "Brasil (+55)", dialCode: "+55" },
  { code: "US", label: "Estados Unidos (+1)", dialCode: "+1" },
  { code: "PT", label: "Portugal (+351)", dialCode: "+351" },
  { code: "ES", label: "Espanha (+34)", dialCode: "+34" },
  { code: "GB", label: "Reino Unido (+44)", dialCode: "+44" }
];

export const getCountryByCode = (code: string) =>
  COUNTRY_OPTIONS.find((option) => option.code === code) ?? COUNTRY_OPTIONS[0];

export const detectCountryByDialCode = (phoneValue: string | null) => {
  if (!phoneValue) {
    return COUNTRY_OPTIONS[0];
  }
  const match = COUNTRY_OPTIONS.find((option) => phoneValue.startsWith(option.dialCode));
  return match ?? COUNTRY_OPTIONS[0];
};
