import { Avatar, Box, Typography } from '@mui/material';
import type { Account } from '../../types/account';
import { getInitials, getAvatarColor } from '../../utils/initials';

interface ProfileHeroProps {
  account: Account;
}

export function ProfileHero({ account }: ProfileHeroProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 3,
        mt: 2,
      }}
    >
      <Avatar
        src={account.photoUrl ?? undefined}
        sx={{
          width: 80,
          height: 80,
          bgcolor: getAvatarColor(account.fullName),
          fontSize: '1.5rem',
        }}
      >
        {getInitials(account.fullName)}
      </Avatar>
      <Typography variant="h6" sx={{ mt: 1 }}>
        {account.fullName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {account.email}
      </Typography>
    </Box>
  );
}
