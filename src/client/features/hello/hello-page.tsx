import { useQuery } from '@tanstack/react-query';
import { fetchHello } from './api.js';

/** Temporary hello-world screen; the Tenant slice replaces it. */
export function HelloPage() {
  const hello = useQuery({ queryKey: ['hello'], queryFn: fetchHello });

  return (
    <main>
      <h1>Fairy</h1>
      {hello.data ? (
        <p>{hello.data.message}</p>
      ) : hello.isFetching ? (
        <p role="status">Carregando…</p>
      ) : hello.isError ? (
        <div role="alert">
          <p>Não foi possível carregar.</p>
          <button type="button" onClick={() => void hello.refetch()}>
            Tentar de novo
          </button>
        </div>
      ) : null}
    </main>
  );
}
