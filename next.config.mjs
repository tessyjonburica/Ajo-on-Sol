/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep this if you need the appDir feature, otherwise remove
    appDir: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules[\\/](dlv)/,
      type: "javascript/auto",
    });

    return config;
  },
};

export default nextConfig;
