import { useWatchContractEvent } from 'wagmi'
import { CONTRACTS } from '@/lib/contracts'
import TokenFactoryABI from '@/lib/abis/TokenFactory.json'

export interface TokenCreatedEvent {
  token: string
  bondingCurve: string
  creator: string
  name: string
  symbol: string
  timestamp: bigint
}

export function useWatchTokenCreated(
  onTokenCreated?: (event: TokenCreatedEvent) => void
) {
  useWatchContractEvent({
    address: CONTRACTS.TokenFactory as `0x${string}`,
    abi: TokenFactoryABI,
    eventName: 'TokenCreated',
    // Only watch for NEW events, don't query historical events
    // This prevents the "limit exceeded" error from querying too many blocks
    poll: true,
    pollingInterval: 5_000, // Poll every 5 seconds for new events
    onLogs(logs) {
      logs.forEach((log: any) => {
        if (log.args && onTokenCreated) {
          const event: TokenCreatedEvent = {
            token: log.args.token as string,
            bondingCurve: log.args.bondingCurve as string,
            creator: log.args.creator as string,
            name: log.args.name as string,
            symbol: log.args.symbol as string,
            timestamp: log.args.timestamp as bigint,
          }
          onTokenCreated(event)
        }
      })
    },
  })
}

export function useWatchTradeEvents(
  bondingCurveAddress: string,
  onTrade?: (event: any) => void
) {
  useWatchContractEvent({
    address: bondingCurveAddress as `0x${string}`,
    abi: [
      {
        anonymous: false,
        inputs: [
          { indexed: true, name: 'buyer', type: 'address' },
          { indexed: false, name: 'asterAmount', type: 'uint256' },
          { indexed: false, name: 'tokenAmount', type: 'uint256' },
        ],
        name: 'Buy',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, name: 'seller', type: 'address' },
          { indexed: false, name: 'tokenAmount', type: 'uint256' },
          { indexed: false, name: 'asterAmount', type: 'uint256' },
        ],
        name: 'Sell',
        type: 'event',
      },
    ],
    onLogs(logs) {
      logs.forEach((log: any) => {
        if (onTrade) {
          onTrade(log)
        }
      })
    },
  })
}
