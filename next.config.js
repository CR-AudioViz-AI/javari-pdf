// 2026-09-10 factory: embed policy (frame-ancestors) comes from the platform SDK.
const __embed = require('@craudioviz/platform-sdk/embed-headers.js');
/** @type {import("next").NextConfig} */
const nextConfig={
  async headers() {
    return [{ source: '/:path*', headers: [...__embed.embedSecurityHeaders()] }];
  },
  // 2026-08-29: required for @craudioviz/platform-sdk. The SDK ships raw
  // TypeScript and Next does not run node_modules through SWC by default, so
  // any import carrying a `type` re-export fails the build without this.
  transpilePackages: ["@craudioviz/platform-sdk"],typescript:{ignoreBuildErrors:true},eslint:{ignoreDuringBuilds:true}}
module.exports=nextConfig
