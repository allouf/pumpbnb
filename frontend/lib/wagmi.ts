import { http, createConfig } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// WalletConnect project ID from cloud.walletconnect.com
const projectId = '2365a77b538750a5741bacd4891ac5cf'

export const config = getDefaultConfig({
  appName: 'ASTER FUN',
  projectId,
  chains: [bscTestnet],
  ssr: true, // Enable SSR support
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
