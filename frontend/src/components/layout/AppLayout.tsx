import { Box, Container, Typography } from '@mui/material';
import { Outlet } from 'react-router';
import { Header } from './Header';

const companyName = import.meta.env.VITE_COMPANY_NAME || 'Minha Conta';

export function AppLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="sm" sx={{ py: 4, px: { xs: 0, sm: 3 }, flex: 1 }}>
        <Outlet />
      </Container>
      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
        sx={{ py: 2 }}
      >
        © {new Date().getFullYear()} {companyName}
      </Typography>
    </Box>
  );
}
