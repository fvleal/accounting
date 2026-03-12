import { Box, Button, Typography } from "@mui/material";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router";
import illustrationProfile from "../assets/illustration-profile.svg";

const companyName = import.meta.env.VITE_COMPANY_NAME || "Minha Conta";
const logoUrl = import.meta.env.VITE_LOGO_URL;

export function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#121212",
        px: 3,
      }}
    >
      <Box
        component="img"
        src={logoUrl}
        alt="Gerencie sua conta"
        sx={{ width: 150, maxWidth: "80%", mb: 5 }}
      />
      <Typography
        variant="h4"
        fontWeight={700}
        color="white"
        textAlign="center"
        gutterBottom
      >
        {companyName}
      </Typography>
      <Typography
        variant="body1"
        color="grey.400"
        textAlign="center"
        sx={{ maxWidth: 360, mb: 5 }}
      >
        Gerencie suas informações pessoais de forma simples e rápida.
      </Typography>
      <Button variant="contained" onClick={() => loginWithRedirect()}>
        Entrar
      </Button>
    </Box>
  );
}
