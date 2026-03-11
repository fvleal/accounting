import React from 'react';
import ReactDOM from 'react-dom/client';
import { StyledEngineProvider, ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router';
import { theme } from './theme';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={theme} defaultMode="dark">
        <CssBaseline />
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <SnackbarProvider maxSnack={3} autoHideDuration={4000}>
              <App />
            </SnackbarProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
