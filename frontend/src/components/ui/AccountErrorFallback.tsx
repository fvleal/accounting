import { Box, Button, Container, Typography } from '@mui/material';

interface Props {
  error: Error;
  onRetry: () => void;
}

function getErrorMessage(error: Error): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axiosError = error as any;
  const status = axiosError?.response?.status;
  const code = axiosError?.code;

  if (!axiosError?.response && (code === 'ERR_NETWORK' || code === 'ECONNREFUSED' || code === 'ECONNABORTED')) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente em instantes.';
  }

  if (!axiosError?.response) {
    return 'O servidor não está respondendo. Tente novamente em instantes.';
  }

  if (status === 500) {
    return 'O servidor encontrou um erro interno. Tente novamente em instantes.';
  }

  if (status === 502 || status === 503 || status === 504) {
    return 'O servidor está temporariamente indisponível. Tente novamente em instantes.';
  }

  if (status === 403) {
    return 'Você não tem permissão para acessar este recurso.';
  }

  if (status === 429) {
    return 'Muitas requisições. Aguarde um momento e tente novamente.';
  }

  return axiosError?.response?.data?.message || 'Ocorreu um erro inesperado. Tente novamente.';
}

export function AccountErrorFallback({ error, onRetry }: Props) {
  return (
    <Container maxWidth="sm" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Erro ao verificar conta
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {getErrorMessage(error)}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button variant="contained" size="small" fullWidth onClick={onRetry}>
          Tentar Novamente
        </Button>
      </Box>
    </Container>
  );
}
