import { useForm, Controller } from 'react-hook-form';
import { cpf } from 'cpf-cnpj-validator';
import { maskCpf, unmaskCpf } from '../utils/cpf';
import { nameRules } from '../utils/validation';
import { useCreateAccount } from '../hooks/useCreateAccount';
import { useNavigate } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Container,
  Card,
  CardContent,
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
  required: 'CPF e obrigatorio',
  validate: (value: string) =>
    cpf.isValid(unmaskCpf(value)) || 'CPF invalido',
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
              message: message || 'CPF ja cadastrado',
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
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Bem-vindo!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Complete seu cadastro para continuar.
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
                fullWidth
                loading={mutation.isPending}
              >
                Criar Conta
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
