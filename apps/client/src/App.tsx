import { RouterProvider } from '@tanstack/react-router';
import { ConnectionProvider } from '@/providers/connection-provider';
import { router } from '@/router';

export function App() {
  return (
    <ConnectionProvider>
      <RouterProvider router={router} />
    </ConnectionProvider>
  );
}
