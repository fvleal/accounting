import { Box, Button, Paper, Typography } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router';

export function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#121212',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          textAlign: 'center',
          maxWidth: 400,
          width: '100%',
          mx: 2,
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Minha Conta
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Gerencie suas informacoes pessoais de forma simples e rapida.
        </Typography>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => loginWithRedirect()}
        >
          Entrar
        </Button>
      </Paper>
    </Box>
  );
}
