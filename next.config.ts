import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Lets devices on the same local network (e.g. a phone during mobile
  // testing) load HMR/dev assets from `next dev`, instead of Next.js
  // blocking them as a cross-origin request. Add any other LAN IP you use
  // to this list.
  allowedDevOrigins: ["192.168.0.20"],

  images: {
    // Google account profile photos, shown on /paskyra for users who
    // signed in with Google (see src/app/paskyra/page.tsx).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
