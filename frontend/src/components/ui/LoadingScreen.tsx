import { Backdrop, Box } from '@mui/material';

const logoUrl = import.meta.env.VITE_LOGO_URL;

export function LoadingScreen() {
  return (
    <Backdrop
      open
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Box
        component="img"
        src={logoUrl}
        alt=""
        sx={{
          width: 80,
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.3 },
            '50%': { opacity: 1 },
          },
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </Backdrop>
  );
}
