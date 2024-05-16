// next.config.mjs
export default {
  reactStrictMode: true,
  webpack(config, options) {
    config.resolve.modules.push(__dirname);
    return config;
  },
};