// Endereço do backend. As chamadas a /api/* são repassadas para ele pelo próprio servidor do Next.js,
// assim o navegador só conversa com o domínio do frontend e o cookie de sessão é "primário"
// (não é bloqueado pelo Safari nem por navegadores que bloqueiam cookies de terceiros).
// Atenção: o valor é lido durante o build (next build).
const backendUrl = (process.env.BACKEND_URL ?? 'http://localhost:3333').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendUrl}/:path*` }];
  },
};

export default nextConfig;
