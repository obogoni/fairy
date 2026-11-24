import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/client',
  plugins: [react()],
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  server: {
    port: Number(process.env.VITE_PORT ?? 5173),
    strictPort: true,
    proxy: {
      '/hello': `http://localhost:${process.env.PORT ?? '3000'}`,
      '/health': `http://localhost:${process.env.PORT ?? '3000'}`,
    },
  },
});
