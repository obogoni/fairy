import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelloPage } from './features/hello/hello-page.js';
import './styles.css';

// Server state lives in memory only: no persister, no browser storage for API data (D4).
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelloPage />
    </QueryClientProvider>
  </StrictMode>,
);
