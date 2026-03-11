import { withAuthenticationRequired } from '@auth0/auth0-react';
import { ComponentType } from 'react';
import { LoadingScreen } from '../components/ui/LoadingScreen';

interface Props {
  component: ComponentType;
}

export function ProtectedRoute({ component }: Props) {
  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => <LoadingScreen />,
  });
  return <Component />;
}
