import { http, createConfig } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// WalletConnect project ID from cloud.walletconnect.com
const projectId = '2365a77b538750a5741bacd4891ac5cf'

// Use the same RPC as backend for consistency
const customBscTestnet = {
  ...bscTestnet,
  rpcUrls: {
    ...bscTestnet.rpcUrls,
    default: {
      http: ['https://bsc-testnet-rpc.publicnode.com']
    },
    public: {
      http: ['https://bsc-testnet-rpc.publicnode.com']
    }
  }
}

export const config = getDefaultConfig({
  appName: 'ASTER FUN',
  projectId,
  chains: [customBscTestnet],
  ssr: true, // Enable SSR support
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
