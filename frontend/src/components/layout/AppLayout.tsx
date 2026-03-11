import { Container } from '@mui/material';
import { Outlet } from 'react-router';
import { Header } from './Header';

export function AppLayout() {
  return (
    <>
      <Header />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}
