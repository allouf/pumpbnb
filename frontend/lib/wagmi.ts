import { http, createConfig } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// WalletConnect project ID from cloud.walletconnect.com
const projectId = '2365a77b538750a5741bacd4891ac5cf'

export const config = createConfig({
  chains: [bscTestnet],
  connectors: [
    injected(),
    metaMask({
      dappMetadata: {
        name: 'ASTER FUN',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://asterfun.com',
      },
      // Disable SDK during SSR
      enableAnalytics: false,
    }),
    walletConnect({ projectId }),
  ],
  transports: {
    [bscTestnet.id]: http(),
  },
  ssr: true, // Enable SSR support
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
