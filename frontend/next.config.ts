import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages hosting at app.gaspartech.com (root path).
  // No basePath needed since the site is at the custom-domain root.
  output: "export",
};

export default nextConfig;
