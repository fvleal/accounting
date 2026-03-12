export const nameRules = {
  required: 'Nome completo e obrigatorio',
  validate: (value: string) => {
    const words = value.trim().split(/\s+/);
    if (words.length < 2) return 'Informe nome e sobrenome';
    if (words.some((w) => w.length < 2))
      return 'Cada parte do nome deve ter pelo menos 2 caracteres';
    return true;
  },
};
