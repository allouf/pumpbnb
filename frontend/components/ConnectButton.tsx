'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="bg-secondary-light text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
      >
        Connect Wallet
      </button>
    </div>
  )
}
