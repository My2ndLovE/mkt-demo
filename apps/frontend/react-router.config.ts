import type { Config } from '@react-router/dev/config';

export default {
  // Use SPA mode (CSR) for Azure Static Web Apps compatibility
  ssr: false,

  // Optimize data fetching with single fetch
  future: {
    unstable_singleFetch: true,
  },

  // App directory configuration
  appDirectory: 'app',

  // Build configuration
  buildDirectory: 'build',

  // Server build path
  serverBuildFile: 'index.js',

  // Public path
  publicPath: '/',

  // Asset build directory
  assetsBuildDirectory: 'public/build',
} satisfies Config;
