import { Navigate, Outlet } from "react-router";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { AccountErrorFallback } from "../components/ui/AccountErrorFallback";
import { useAccount } from "../hooks/useAccount";

export function AccountGuard() {
  const { data: _account, isLoading, error, refetch } = useAccount();

  if (isLoading) return <LoadingScreen />;

  if (error) {
    // 404 = new user, redirect to onboarding
    if ((error as any).response?.status === 404) {
      return <Navigate to="/onboarding" replace />;
    }
    // Other errors: show error screen with retry
    return <AccountErrorFallback error={error} onRetry={() => refetch()} />;
  }

  return <Outlet />;
}
