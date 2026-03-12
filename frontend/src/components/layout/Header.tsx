import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { useAccount } from '../../hooks/useAccount';
import { getAvatarColor, getInitials } from '../../utils/initials';

const logoUrl = import.meta.env.VITE_LOGO_URL;
const companyName = import.meta.env.VITE_COMPANY_NAME || 'Minha Conta';

export function Header() {
  const { logout } = useAuth0();
  const { data: account } = useAccount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        {logoUrl && (
          <Box
            component="img"
            src={logoUrl}
            alt="Logo"
            sx={{ height: 32, mr: 1.5 }}
          />
        )}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
        >
          {companyName}
        </Typography>

        {account && (
          <Box>
            <IconButton onClick={handleOpen} size="small" aria-label="menu do usuario">
              <Avatar
                src={account.photoUrl ?? undefined}
                alt={account.name}
                sx={{ width: 32, height: 32, bgcolor: getAvatarColor(account.name) }}
              >
                {getInitials(account.name)}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2">{account.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {account.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout}>Sair</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
