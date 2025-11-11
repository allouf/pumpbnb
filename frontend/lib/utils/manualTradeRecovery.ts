import { PublicClient, createPublicClient, http, parseAbiItem, decodeEventLog } from 'viem'
import { astar } from 'viem/chains'

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain: astar,
  transport: http()
})

// Bonding Curve events
const TRADE_EVENT_ABI = parseAbiItem(
  'event Trade(address indexed trader, bool indexed isBuy, uint256 amountIn, uint256 amountOut, uint256 fee)'
)

const BUY_EVENT_ABI = parseAbiItem(
  'event Buy(address indexed trader, uint256 asterIn, uint256 tokensOut, uint256 fee)'
)

const SELL_EVENT_ABI = parseAbiItem(
  'event Sell(address indexed trader, uint256 tokensIn, uint256 asterOut, uint256 fee)'
)

export interface RecoveredTrade {
  txHash: string
  tokenAddress: string
  trader: string
  isBuy: boolean
  amountIn: string
  amountOut: string
  fee: string
  timestamp: string
  blockNumber: number
}

/**
 * Manually recover trade data from a transaction hash
 * This bypasses the backend indexing and reads directly from the blockchain
 */
export async function recoverTradeFromTxHash(
  txHash: string,
  tokenAddress: string
): Promise<RecoveredTrade | null> {
  try {
    console.log(`[Recovery] 🔍 Recovering trade from tx: ${txHash}`)
    
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
    
    if (!receipt) {
      console.error(`[Recovery] ❌ Transaction receipt not found: ${txHash}`)
      return null
    }

    console.log(`[Recovery] 📋 Transaction receipt found, block: ${receipt.blockNumber}`)

    // Get block to extract timestamp
    const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber })
    
    // Look for trade events in the logs
    let tradeEvent = null
    let isBuy = false
    let amountIn = '0'
    let amountOut = '0'
    let fee = '0'
    let trader = ''

    // Try to find Trade event (newer contracts)
    try {
      const tradeLogs = receipt.logs.filter(log => {
        try {
          const decoded = decodeEventLog({
            abi: [TRADE_EVENT_ABI],
            data: log.data,
            topics: log.topics
          })
          return decoded.eventName === 'Trade'
        } catch {
          return false
        }
      })

      if (tradeLogs.length > 0) {
        const decoded = decodeEventLog({
          abi: [TRADE_EVENT_ABI],
          data: tradeLogs[0].data,
          topics: tradeLogs[0].topics
        }) as any

        trader = decoded.args.trader
        isBuy = decoded.args.isBuy
        amountIn = decoded.args.amountIn.toString()
        amountOut = decoded.args.amountOut.toString()
        fee = decoded.args.fee.toString()
        tradeEvent = decoded
      }
    } catch (e) {
      console.log(`[Recovery] Trade event not found, trying Buy/Sell events...`)
    }

    // Try Buy event
    if (!tradeEvent) {
      try {
        const buyLogs = receipt.logs.filter(log => {
          try {
            const decoded = decodeEventLog({
              abi: [BUY_EVENT_ABI],
              data: log.data,
              topics: log.topics
            })
            return decoded.eventName === 'Buy'
          } catch {
            return false
          }
        })

        if (buyLogs.length > 0) {
          const decoded = decodeEventLog({
            abi: [BUY_EVENT_ABI],
            data: buyLogs[0].data,
            topics: buyLogs[0].topics
          }) as any

          trader = decoded.args.trader
          isBuy = true
          amountIn = decoded.args.asterIn.toString()
          amountOut = decoded.args.tokensOut.toString()
          fee = decoded.args.fee.toString()
          tradeEvent = decoded
        }
      } catch (e) {
        console.log(`[Recovery] Buy event not found, trying Sell event...`)
      }
    }

    // Try Sell event
    if (!tradeEvent) {
      try {
        const sellLogs = receipt.logs.filter(log => {
          try {
            const decoded = decodeEventLog({
              abi: [SELL_EVENT_ABI],
              data: log.data,
              topics: log.topics
            })
            return decoded.eventName === 'Sell'
          } catch {
            return false
          }
        })

        if (sellLogs.length > 0) {
          const decoded = decodeEventLog({
            abi: [SELL_EVENT_ABI],
            data: sellLogs[0].data,
            topics: sellLogs[0].topics
          }) as any

          trader = decoded.args.trader
          isBuy = false
          amountIn = decoded.args.tokensIn.toString()
          amountOut = decoded.args.asterOut.toString()
          fee = decoded.args.fee.toString()
          tradeEvent = decoded
        }
      } catch (e) {
        console.log(`[Recovery] Sell event not found either`)
      }
    }

    if (!tradeEvent) {
      console.error(`[Recovery] ❌ No trade events found in transaction: ${txHash}`)
      return null
    }

    const recoveredTrade: RecoveredTrade = {
      txHash,
      tokenAddress,
      trader,
      isBuy,
      amountIn,
      amountOut,
      fee,
      timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
      blockNumber: Number(receipt.blockNumber)
    }

    console.log(`[Recovery] ✅ Trade recovered:`, recoveredTrade)
    return recoveredTrade

  } catch (error) {
    console.error(`[Recovery] ❌ Error recovering trade from ${txHash}:`, error)
    return null
  }
}

/**
 * Recover multiple trades from transaction hashes
 */
export async function recoverMultipleTrades(
  txHashes: string[],
  tokenAddress: string
): Promise<RecoveredTrade[]> {
  const recoveredTrades: RecoveredTrade[] = []
  
  for (const txHash of txHashes) {
    const trade = await recoverTradeFromTxHash(txHash, tokenAddress)
    if (trade) {
      recoveredTrades.push(trade)
    }
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return recoveredTrades
}