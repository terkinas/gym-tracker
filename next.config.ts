import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Lets devices on the same local network (e.g. a phone during mobile
  // testing) load HMR/dev assets from `next dev`, instead of Next.js
  // blocking them as a cross-origin request. Add any other LAN IP you use
  // to this list.
  allowedDevOrigins: ["192.168.0.20"],

  experimental: {
    // Keep a visited page's data in the browser for 30 s, so going back to a
    // page you just left is instant instead of a server round trip (every
    // page here is dynamic and defaults to 0 s). Safe only because every
    // mutation drops the browser's cached pages: server actions call
    // `revalidatePath`, or set/delete cookies (login, logout, language) —
    // and Next currently drops ALL cached pages on any of those, not only the
    // path named (its docs call that temporary; re-check when upgrading Next).
    // If you add a new action that changes data shown on another page, it
    // must do the same. Set `dynamic: 0` (or remove this block) to turn it off.
    staleTimes: { dynamic: 30 },
  },

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
