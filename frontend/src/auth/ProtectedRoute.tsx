import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, Outlet } from "react-router";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { AuthErrorFallback } from "../components/ui/AuthErrorFallback";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, error } = useAuth0();

  if (isLoading) return <LoadingScreen />;
  if (error) return <AuthErrorFallback error={error} />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
