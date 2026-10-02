import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const backend = loadEnv(mode, ".", "VITE_").VITE_BACKEND_URL || "http://localhost:8080";
  const backendPaths = ["/api", "/login", "/logout", "/dev", "/sso", "/healthz"];

  return {
    esbuild: { jsx: "automatic" },
    server: {
      host: "0.0.0.0",
      port: 5173,
      watch: { usePolling: true },
      proxy: Object.fromEntries(backendPaths.map(path => [path, { target: backend, changeOrigin: false }])),
    },
  };
});
