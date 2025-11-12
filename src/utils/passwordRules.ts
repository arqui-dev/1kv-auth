export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "Mínimo de 10 caracteres", test: (value) => value.length >= 10 },
  { id: "uppercase", label: "Pelo menos uma letra maiúscula", test: (value) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "Pelo menos uma letra minúscula", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "Pelo menos um número", test: (value) => /[0-9]/.test(value) },
  {
    id: "special",
    label: "Pelo menos um caractere especial",
    test: (value) => /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/]/.test(value)
  },
  { id: "whitespace", label: "Sem espaços em branco", test: (value) => !/\s/.test(value) }
];

export const getPasswordIssues = (value: string) =>
  PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label);
