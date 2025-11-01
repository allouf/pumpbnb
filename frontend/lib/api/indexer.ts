/**
 * API client for immediate indexing services
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

export interface IndexTradeRequest {
  txHash: string
  tokenAddress: string
}

export interface IndexTokenRequest {
  txHash: string
  tokenAddress?: string
  bondingCurve?: string
  creator?: string
  name?: string
  symbol?: string
}

/**
 * Index a trade transaction immediately
 * This ensures the trade appears in the chart and trade history without waiting for background indexer
 */
export async function indexTrade(request: IndexTradeRequest): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/indexer/index-trade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to index trade')
    }

    return data
  } catch (error) {
    console.error('[Index Trade] Error:', error)
    // Don't throw - indexing is non-critical for UX
    // The background indexer will pick it up eventually
    return null
  }
}

/**
 * Index a token creation transaction immediately
 */
export async function indexToken(request: IndexTokenRequest): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/indexer/index-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to index token')
    }

    return data
  } catch (error) {
    console.error('[Index Token] Error:', error)
    return null
  }
}

/**
 * Check if a token has been indexed
 */
export async function checkTokenIndexStatus(tokenAddress: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/indexer/check-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenAddress }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check token status')
    }

    return data.data?.indexed || false
  } catch (error) {
    console.error('[Check Token Status] Error:', error)
    return false
  }
}
