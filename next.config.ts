import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Verify production builds separately while the local editor remains open.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
};
export default config;
