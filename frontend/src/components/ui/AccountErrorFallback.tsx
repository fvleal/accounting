import { Box, Button, Paper, Typography } from '@mui/material';

interface Props {
  error: Error;
  onRetry: () => void;
}

export function AccountErrorFallback({ error, onRetry }: Props) {
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
          Erro ao verificar conta
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error.message}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          <Button variant="contained" onClick={onRetry}>
            Tentar Novamente
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
