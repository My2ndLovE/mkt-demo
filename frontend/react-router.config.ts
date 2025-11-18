import type { Config } from '@react-router/dev/config';

export default {
  // Disable SSR for Azure Static Web Apps (Client-Side Rendering only)
  ssr: false,

  // Application directory
  appDirectory: 'app',

  // Build directory
  buildDirectory: 'build',

  // Server build path
  serverBuildFile: 'index.js',

  // Public path for assets
  publicPath: '/',

  // Server module format
  serverModuleFormat: 'esm',

  // Future flags (for gradual adoption of breaking changes)
  future: {
    // Enable future flags as they become available
  },

  // Prerender configuration (optional for static pages)
  async prerender() {
    // Add static routes to prerender if needed
    return ['/'];
  },
} satisfies Config;
