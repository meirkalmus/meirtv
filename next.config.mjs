/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.vimeocdn.com" },
      { protocol: "https", hostname: "vimeo.com" },
      { protocol: "https", hostname: "vumbnail.com" },
      { protocol: "https", hostname: "meirtv.com" },
      { protocol: "https", hostname: "**.cloudwaysapps.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;

