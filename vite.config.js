import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const isApp = mode === "app";

  const HOST = env.VITE_APP_HOST || "0.0.0.0";
  const PORT = parseInt(env.VITE_APP_PORT || "5173", 10);

  const securityHeaders = {
    "X-Content-Type-Options": env.VITE_SECURITY_NO_SNIFF || "nosniff",
    "X-Frame-Options": env.VITE_SECURITY_FRAME_OPTIONS || "DENY",
    "X-XSS-Protection": env.VITE_SECURITY_XSS_PROTECTION || "1; mode=block",
    "Referrer-Policy":
      env.VITE_SECURITY_REFERRER_POLICY || "strict-origin-when-cross-origin",
    "Permissions-Policy":
      env.VITE_SECURITY_PERMISSIONS_POLICY ||
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
    "X-DNS-Prefetch-Control": "off",
    "X-Download-Options": "noopen",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Strict-Transport-Security":
      env.VITE_SECURITY_HSTS || "max-age=31536000; includeSubDomains; preload",
  };

  return {
    plugins: [
      react(),
      isApp &&
        legacy({
          modernTargets: ["chrome >= 64", "android >= 7"],
          modernPolyfills: true,
          renderLegacyChunks: false,
        }),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          cleanupOutdatedCaches: true, 

          navigateFallback: null,
          globPatterns: ["**/*.{js,css,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "html-cache",
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60,
                },
              },
            },
            {
              urlPattern: /\/api\/.*/,
              handler: "NetworkOnly",
            },
          ],
        },
        manifest: {
          name: env.VITE_APP_NAME || "Gestor de Fichas – IndusPower",
          short_name: "Gestor de Fichas",
          description: "Sistema de fichas de inspeção e controle IndusPower",
          theme_color: "#1565C0",
          background_color: "#0a0f1e",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],

    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      cors: {
        origin: (env.VITE_APP_ALLOWED_ORIGINS || "")
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean),
        credentials: false,
      },
      headers: securityHeaders,
      hmr: true,
    },

    preview: {
      host: HOST,
      port: PORT + 1,
      strictPort: true,
      headers: securityHeaders,
    },

    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          chunkFileNames: "assets/[hash].js",
          entryFileNames: "assets/[hash].js",
          assetFileNames: "assets/[hash].[ext]",
        },
      },
    },

    envPrefix: "VITE_",
  };
});
