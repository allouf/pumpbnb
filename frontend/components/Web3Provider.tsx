'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { type State, WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/wagmi'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { ProfileCard } from './ProfileCard'

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css'

type Props = {
  children: ReactNode
  initialState?: State
}

function Web3ProviderContent({ children }: { children: ReactNode }) {
  const { showProfileCard, setShowProfileCard } = useWalletAuth()

  return (
    <>
      {children}
      {showProfileCard && (
        <ProfileCard onClose={() => setShowProfileCard(false)} />
      )}
    </>
  )
}

export function Web3Provider({ children, initialState }: Props) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <Web3ProviderContent>
            {children}
          </Web3ProviderContent>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
