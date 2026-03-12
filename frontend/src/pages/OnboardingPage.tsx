import { useForm, Controller } from 'react-hook-form';
import { cpf } from 'cpf-cnpj-validator';
import { maskCpf, unmaskCpf } from '../utils/cpf';
import { nameRules } from '../utils/validation';
import { useCreateAccount } from '../hooks/useCreateAccount';
import { useNavigate } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';

interface OnboardingFormData {
  name: string;
  cpf: string;
}

const cpfRules = {
  required: 'CPF é obrigatório',
  validate: (value: string) =>
    cpf.isValid(unmaskCpf(value)) || 'CPF inválido',
};

export function OnboardingPage() {
  const { control, handleSubmit, setError } = useForm<OnboardingFormData>({
    defaultValues: { name: '', cpf: '' },
    mode: 'onBlur',
  });

  const mutation = useCreateAccount();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const onSubmit = (data: OnboardingFormData) => {
    mutation.mutate(
      { name: data.name.trim(), cpf: unmaskCpf(data.cpf) },
      {
        onSuccess: () => {
          enqueueSnackbar('Conta criada!', { variant: 'success' });
          navigate('/', { replace: true });
        },
        onError: (error: any) => {
          const status = error?.response?.status;
          const message = error?.response?.data?.message;

          if (
            status === 409 ||
            (message && /cpf/i.test(message))
          ) {
            setError('cpf', {
              message: message || 'CPF já cadastrado',
            });
          } else {
            enqueueSnackbar('Erro inesperado. Tente novamente.', {
              variant: 'error',
            });
          }
        },
      },
    );
  };

  return (
    <Box sx={{ px: 2 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Primeiro acesso
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Verificamos que este é seu primeiro acesso. Preencha os dados abaixo para criar sua conta.
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Controller
          name="name"
          control={control}
          rules={nameRules}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Nome completo"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="cpf"
          control={control}
          rules={cpfRules}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              onChange={(e) => field.onChange(maskCpf(e.target.value))}
              label="CPF"
              placeholder="000.000.000-00"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          size="small"
          fullWidth
          loading={mutation.isPending}
        >
          Criar Conta
        </Button>
      </Box>
    </Box>
  );
}
