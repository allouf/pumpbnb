'use client'

import { useState } from 'react'
import { recoverTradeFromTxHash, RecoveredTrade } from '@/lib/utils/manualTradeRecovery'
import { useLocalTradeCache } from '@/lib/hooks/useLocalTradeCache'
import toast from 'react-hot-toast'

interface TradeRecoveryProps {
  tokenAddress: string
  onClose: () => void
}

export function TradeRecovery({ tokenAddress, onClose }: TradeRecoveryProps) {
  const [txHashes, setTxHashes] = useState('')
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveredTrades, setRecoveredTrades] = useState<RecoveredTrade[]>([])
  const { addLocalTrade } = useLocalTradeCache(tokenAddress)

  const handleRecover = async () => {
    const hashes = txHashes
      .split(/[\n,\s]+/)
      .map(h => h.trim())
      .filter(h => h.length > 0)

    if (hashes.length === 0) {
      toast.error('Please enter at least one transaction hash')
      return
    }

    setIsRecovering(true)
    const toastId = toast.loading(`Recovering ${hashes.length} transaction(s)...`)

    try {
      const recovered: RecoveredTrade[] = []

      for (const hash of hashes) {
        console.log(`[TradeRecovery] 🔄 Processing ${hash}`)
        const trade = await recoverTradeFromTxHash(hash, tokenAddress)
        if (trade) {
          recovered.push(trade)
        }
      }

      setRecoveredTrades(recovered)

      if (recovered.length > 0) {
        toast.success(`✅ Recovered ${recovered.length} transaction(s)!`, { id: toastId })
      } else {
        toast.error('❌ No valid trades found in the provided transactions', { id: toastId })
      }
    } catch (error) {
      console.error('[TradeRecovery] Error:', error)
      toast.error('❌ Recovery failed. Check console for details.', { id: toastId })
    } finally {
      setIsRecovering(false)
    }
  }

  const handleSaveToCache = async () => {
    if (recoveredTrades.length === 0) return

    try {
      for (const trade of recoveredTrades) {
        // Convert RecoveredTrade to LocalTrade format
        const localTrade = {
          tokenAddress: trade.tokenAddress,
          trader: trade.trader,
          isBuy: trade.isBuy,
          amountIn: trade.amountIn,
          amountOut: trade.amountOut,
          fee: trade.fee,
          timestamp: trade.timestamp,
          txHash: trade.txHash,
          blockNumber: trade.blockNumber,
          asterAmount: trade.isBuy ? trade.amountIn : trade.amountOut,
          tokenAmount: trade.isBuy ? trade.amountOut : trade.amountIn,
        }

        addLocalTrade(localTrade)
      }

      toast.success(`✅ ${recoveredTrades.length} trade(s) added to local cache!`)
      setRecoveredTrades([])
      onClose()
    } catch (error) {
      console.error('[TradeRecovery] Error saving to cache:', error)
      toast.error('❌ Failed to save trades to cache')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-secondary rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">📡 Trade Recovery Tool</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-300 mb-4 text-sm">
          Enter the transaction hashes of your trades that failed to index. 
          This tool will read directly from the blockchain to recover your trade data.
        </p>

        {/* Input Area */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Transaction Hashes (one per line or comma-separated)
          </label>
          <textarea
            value={txHashes}
            onChange={(e) => setTxHashes(e.target.value)}
            placeholder="0x1234...&#10;0x5678...&#10;0x9abc..."
            className="w-full h-32 px-3 py-2 bg-secondary-light rounded-lg border border-gray-700 focus:border-primary focus:outline-none text-sm font-mono"
            disabled={isRecovering}
          />
        </div>

        {/* Recovery Button */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleRecover}
            disabled={isRecovering || !txHashes.trim()}
            className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRecovering ? '🔄 Recovering...' : '🔍 Recover Trades'}
          </button>

          {recoveredTrades.length > 0 && (
            <button
              onClick={handleSaveToCache}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
            >
              💾 Save to Cache ({recoveredTrades.length})
            </button>
          )}
        </div>

        {/* Results */}
        {recoveredTrades.length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="font-semibold mb-3">📊 Recovered Trades:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recoveredTrades.map((trade, index) => (
                <div
                  key={index}
                  className="bg-secondary-light p-3 rounded-lg text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${
                      trade.isBuy ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trade.isBuy ? '📈 Buy' : '📉 Sell'}
                    </span>
                    <span className="text-gray-400 font-mono text-xs">
                      {trade.txHash.slice(0, 10)}...
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div>Amount In: {(Number(trade.amountIn) / 1e18).toFixed(6)}</div>
                    <div>Amount Out: {(Number(trade.amountOut) / 1e18).toFixed(6)}</div>
                    <div>Block: {trade.blockNumber}</div>
                    <div>Trader: {trade.trader.slice(0, 8)}...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-xs">
            <strong>💡 How to find your transaction hashes:</strong><br/>
            1. Check your wallet transaction history<br/>
            2. Look for the two sell transactions you made on token 4<br/>
            3. Copy the transaction hashes and paste them above<br/>
            4. Click "Recover Trades" to extract the data from blockchain
          </p>
        </div>
      </div>
    </div>
  )
}