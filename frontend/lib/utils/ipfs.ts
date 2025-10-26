/**
 * IPFS utilities for uploading and retrieving token metadata
 */

export interface TokenMetadata {
  name: string
  symbol: string
  description?: string
  image?: string // IPFS hash or URL
  website?: string
  twitter?: string
  telegram?: string
}

/**
 * Upload token metadata to IPFS via Pinata gateway
 * For now, we'll use a public IPFS gateway for reading
 * In production, you'd use Pinata API with authentication
 */
export async function uploadMetadata(metadata: TokenMetadata): Promise<string> {
  // TODO: Implement Pinata API integration with authentication
  // For MVP, we'll just return a placeholder
  console.log('Metadata to upload:', metadata)

  // In production:
  // const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${PINATA_JWT}`,
  //   },
  //   body: JSON.stringify(metadata),
  // })
  // const data = await response.json()
  // return data.IpfsHash

  return '' // Empty for now - metadata stored on-chain only
}

/**
 * Upload image to IPFS via Pinata
 */
export async function uploadImage(file: File): Promise<string> {
  // TODO: Implement Pinata API integration
  console.log('Image to upload:', file.name)

  // In production:
  // const formData = new FormData()
  // formData.append('file', file)
  // const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${PINATA_JWT}`,
  //   },
  //   body: formData,
  // })
  // const data = await response.json()
  // return data.IpfsHash

  return '' // Empty for now
}

/**
 * Get IPFS URL from hash
 */
export function getIpfsUrl(hash: string): string {
  if (!hash) return ''

  // Use public IPFS gateway
  return `https://ipfs.io/ipfs/${hash}`
}

/**
 * Fetch metadata from IPFS or metadata URI
 */
export async function fetchMetadata(metadataUri: string): Promise<TokenMetadata | null> {
  if (!metadataUri) return null

  try {
    // If it's an IPFS hash, convert to URL
    let url = metadataUri
    if (metadataUri.startsWith('Qm') || metadataUri.startsWith('bafy')) {
      url = getIpfsUrl(metadataUri)
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch metadata')
    }

    const metadata = await response.json()
    return metadata
  } catch (error) {
    console.error('Error fetching metadata:', error)
    return null
  }
}

/**
 * Generate avatar from token symbol (fallback when no image)
 */
export function generateTokenAvatar(symbol: string): string {
  // Create a deterministic color from symbol
  const colors = [
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-red-500 to-pink-500',
    'from-yellow-500 to-orange-500',
    'from-indigo-500 to-blue-500',
    'from-purple-500 to-pink-500',
  ]

  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colorIndex = hash % colors.length

  return colors[colorIndex]
}
