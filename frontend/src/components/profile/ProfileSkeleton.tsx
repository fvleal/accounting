import { Box, Card, CardContent, Skeleton } from '@mui/material';

export function ProfileSkeleton() {
  return (
    <>
      {/* Hero skeleton */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 3,
          mt: 2,
        }}
      >
        <Skeleton variant="circular" width={80} height={80} />
        <Skeleton variant="text" width={160} sx={{ mt: 1 }} />
        <Skeleton variant="text" width={200} />
      </Box>

      {/* Card 1: Informacoes basicas (3 rows) */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Skeleton variant="text" width={180} sx={{ mb: 1 }} />
          <Skeleton variant="text" height={48} />
          <Skeleton variant="text" height={48} />
          <Skeleton variant="text" height={48} />
        </CardContent>
      </Card>

      {/* Card 2: Informacoes adicionais (2 rows) */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Skeleton variant="text" width={200} sx={{ mb: 1 }} />
          <Skeleton variant="text" height={48} />
          <Skeleton variant="text" height={48} />
        </CardContent>
      </Card>
    </>
  );
}
