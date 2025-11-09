/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize build performance
  experimental: {
    optimizePackageImports: ['lightweight-charts', 'recharts'],
    // Enable for potential memory improvement during builds (Next.js 14.1.0+)
    webpackBuildWorker: true,
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize for production builds
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Bundle lightweight-charts separately
          charts: {
            name: 'charts',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](lightweight-charts|recharts)/,
            priority: 40,
            enforce: true,
          },
          // Bundle crypto/web3 libraries
          web3: {
            name: 'web3',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@rainbow-me|wagmi|viem)/,
            priority: 30,
            enforce: true,
          },
          // Main vendor bundle
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
            enforce: true,
          },
        },
      }
    }

    return config
  },

  // Image optimization (updated to use remotePatterns)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        // Add a pathname wildcard to allow all images from this host
        pathname: '**',
      },
    ],
  },

  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
  // Also consider disabling server-side source maps for memory usage
  experimental: {
    serverSourceMaps: false,
  },
}

module.exports = nextConfig