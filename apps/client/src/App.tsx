import { RouterProvider } from '@tanstack/react-router';
import { ConnectionProvider } from '@/providers/connection-provider';
import { SetupWizard } from '@/components/settings/setup-wizard';
import { router } from '@/router';

export function App() {
  return (
    <ConnectionProvider>
      <SetupWizard />
      <RouterProvider router={router} />
    </ConnectionProvider>
  );
}
