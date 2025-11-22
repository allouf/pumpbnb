/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize build performance
  experimental: {
    optimizePackageImports: ['lightweight-charts', 'recharts'],
    webpackBuildWorker: true,
    serverSourceMaps: false,
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Fix MetaMask SDK React Native module warnings
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    }

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
        pathname: '**',
      },
    ],
  },

  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig