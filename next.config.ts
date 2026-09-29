import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
    ] }];
  },
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "www.mytruckpay.com" }], destination: "https://mytruckpay.com/:path*", permanent: true }];
  },
  serverExternalPackages: ["unpdf"],
  allowedDevOrigins: ["127.0.0.1", "*.trycloudflare.com"],
  ...(process.env.NODE_ENV === "development" && process.env.MTP_DEV_IN_PROCESS === "1"
    ? { experimental: { workerThreads: true, useTypeScriptCli: false } }
    : {}),
};

export default nextConfig;
