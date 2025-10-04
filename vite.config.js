import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        account: 'account.html',
        success: 'success.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
