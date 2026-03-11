import { Typography } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

export function HomePage() {
  const { user } = useAuth0();

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Bem-vindo, {user?.name}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Pagina de perfil em breve.
      </Typography>
    </>
  );
}
