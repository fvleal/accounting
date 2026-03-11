import { Routes, Route } from 'react-router';
import { AuthProviderWithNavigate } from './auth/AuthProviderWithNavigate';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <AuthProviderWithNavigate>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<ProtectedRoute component={HomePage} />} />
        </Route>
      </Routes>
    </AuthProviderWithNavigate>
  );
}

export default App;
