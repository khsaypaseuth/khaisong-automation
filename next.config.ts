import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modules that must not be bundled by the server build.
  serverExternalPackages: ["@resvg/resvg-js"],
};

export default nextConfig;
