import { Box, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface ProfileFieldRowProps {
  label: string;
  value: string | null;
  editable?: boolean;
}

export function ProfileFieldRow({ label, value, editable }: ProfileFieldRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.5,
        px: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant="body2"
          color={value ? 'text.primary' : 'text.secondary'}
        >
          {value ?? 'Nao informado'}
        </Typography>
        {editable && (
          <ChevronRightIcon
            data-testid="chevron-icon"
            sx={{ fontSize: 20, color: 'text.secondary' }}
          />
        )}
      </Box>
    </Box>
  );
}
