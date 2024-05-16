export default nextConfig;
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack(config, options) {
    config.resolve.modules.push(__dirname);
    return config;
  },
}