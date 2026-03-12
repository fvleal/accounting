export const nameRules = {
  required: 'Nome completo é obrigatório',
  minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
  maxLength: { value: 200, message: 'Nome deve ter no máximo 200 caracteres' },
  validate: (value: string) => {
    const words = value.trim().split(/\s+/);
    if (words.length < 2) return 'Informe nome e sobrenome';
    if (words.some((w) => w.length < 2))
      return 'Cada parte do nome deve ter pelo menos 2 caracteres';
    return true;
  },
};

export const birthDateRules = {
  required: 'Data de nascimento é obrigatória',
  pattern: {
    value: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Data deve estar no formato AAAA-MM-DD',
  },
};
