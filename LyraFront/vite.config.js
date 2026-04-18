import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: { '@': '/src' },
    },
    server: {
      allowedHosts,
    },
    preview: {
      allowedHosts,
    },
  }
})
