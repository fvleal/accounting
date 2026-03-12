import { Routes, Route } from 'react-router';
import { AuthProviderWithNavigate } from './auth/AuthProviderWithNavigate';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AccountGuard } from './auth/AccountGuard';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { OnboardingPage } from './pages/OnboardingPage';

function App() {
  return (
    <AuthProviderWithNavigate>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          {/* Onboarding: authenticated but no account yet */}
          <Route path="/onboarding" element={<AppLayout />}>
            <Route index element={<OnboardingPage />} />
          </Route>
          {/* All other routes: require account */}
          <Route element={<AccountGuard />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProviderWithNavigate>
  );
}

export default App;
