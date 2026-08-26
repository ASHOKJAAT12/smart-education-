import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';

/**
 * Root query client for TanStack Query.
 * Global defaults — all queries can override per-query.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,         // 1 minute before refetch on re-mount
      gcTime: 5 * 60_000,        // 5 minutes before garbage collection
      retry: 1,                  // retry failed requests once
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * App — root component.
 * Provider order (outer → inner):
 *   QueryClientProvider (server state)
 *   BrowserRouter (routing)
 *   AuthProvider (auth + user state)
 *   AppRouter (renders pages)
 */
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
