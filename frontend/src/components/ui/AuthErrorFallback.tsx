import { Box, Button, Paper, Typography } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';

interface Props {
  error: Error;
}

export function AuthErrorFallback({ error }: Props) {
  const { loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#121212',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Erro de Autenticacao
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error.message}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          <Button
            variant="contained"
            onClick={() => loginWithRedirect()}
          >
            Tentar Novamente
          </Button>
          <Button
            variant="text"
            onClick={() => navigate('/login')}
          >
            Voltar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
