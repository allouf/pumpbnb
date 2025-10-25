import { http, createConfig } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// WalletConnect project ID (you'll need to get one from cloud.walletconnect.com)
const projectId = 'YOUR_PROJECT_ID_HERE'

export const config = createConfig({
  chains: [bscTestnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [bscTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
