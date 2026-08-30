import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Consumido pela config do Node, não pelo código do cliente — por isso SEM o
// prefixo VITE_, que sugeriria falsamente que chega ao navegador.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind em 0.0.0.0: obrigatório dentro do container.
    host: true,
    port: 5173,
    strictPort: true,
    // Aceita qualquer Host, para o site abrir por túnel (ngrok, Cloudflare
    // Tunnel, IP da LAN). Isto desliga a proteção do Vite contra DNS rebinding,
    // que existe para impedir um site malicioso de ler o seu código-fonte pelo
    // servidor de dev. Vale só para `npm run dev` — o build de produção é
    // servido pelo nginx e não passa por aqui.
    allowedHosts: true,
    proxy: {
      // O navegador só enxerga uma origem: o frontend chama /api e quem
      // encaminha é o Vite (dev) ou o nginx (prod). É isso que faz o cookie
      // httpOnly funcionar sem CORS e sem SameSite=None.
      '/api': {
        target: apiTarget,
        changeOrigin: false,
      },
    },
  },
  preview: { host: true, port: 4173 },
})
