/** Same server, another database; sslmode=disable because local and CI Postgres have no TLS. */
export function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  parsed.searchParams.set('sslmode', 'disable');
  return parsed.toString();
}

export function withUser(url: string, user: string, password: string): string {
  const parsed = new URL(url);
  parsed.username = user;
  parsed.password = password;
  return parsed.toString();
}
