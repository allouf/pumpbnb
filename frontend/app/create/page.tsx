'use client'

import { useState, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useRouter } from 'next/navigation'
import { CONTRACTS } from '@/lib/contracts'
import TokenFactoryABI from '@/lib/abis/TokenFactory.json'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function CreateTokenPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form fields
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')
  const [discord, setDiscord] = useState('')

  // UI states
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const [metadataURI, setMetadataURI] = useState('')

  const { data: hash, isPending, writeContract, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image must be less than 15MB')
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setUploadError('Only JPG, PNG, or GIF images are allowed')
      return
    }

    setImage(file)
    setUploadError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>
      handleImageChange(fakeEvent)
    }
  }

  // Upload image to IPFS via backend
  const uploadImageToIPFS = async (): Promise<string> => {
    if (!image) return ''

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', image)

      const response = await fetch(`${API_URL}/api/ipfs/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      return data.ipfsHash || data.url || ''
    } catch (err) {
      console.error('Error uploading to IPFS:', err)
      setUploadError('Failed to upload image. Please try again.')
      return ''
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Upload metadata to IPFS via backend
  const uploadMetadataToIPFS = async (imageUrl: string): Promise<string> => {
    try {
      const metadata = {
        name,
        symbol,
        description,
        image: imageUrl,
        external_url: website || undefined,
        attributes: [],
        properties: {
          social: {
            twitter: twitter || undefined,
            telegram: telegram || undefined,
            discord: discord || undefined,
            website: website || undefined,
          },
        },
      }

      const response = await fetch(`${API_URL}/api/ipfs/upload-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      })

      if (!response.ok) {
        throw new Error('Failed to upload metadata')
      }

      const data = await response.json()
      return data.ipfsHash || data.url || ''
    } catch (err) {
      console.error('Error uploading metadata:', err)
      return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (!name || !symbol) {
      alert('Please fill in token name and symbol')
      return
    }

    try {
      // Upload image to IPFS if provided
      let imageUrl = ''
      if (image) {
        imageUrl = await uploadImageToIPFS()
        if (!imageUrl && image) {
          alert('Failed to upload image. Please try again.')
          return
        }
      }

      // Upload metadata to IPFS
      let metadataUri = ''
      if (imageUrl || description || website || twitter || telegram || discord) {
        metadataUri = await uploadMetadataToIPFS(imageUrl)
      }

      setMetadataURI(metadataUri)

      // Create token on blockchain
      writeContract({
        address: CONTRACTS.TokenFactory as `0x${string}`,
        abi: TokenFactoryABI,
        functionName: 'createToken',
        args: [name, symbol, metadataUri || ''],
      })
    } catch (err) {
      console.error('Error creating token:', err)
    }
  }

  // Redirect to token page on success
  if (isSuccess && hash) {
    // Extract token address from event logs (would need to parse the receipt)
    // For now, redirect to tokens page
    setTimeout(() => {
      router.push('/tokens')
    }, 2000)
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">Create new coin</h1>
        <p className="text-gray-400 mb-8">
          Launch your meme coin in seconds on BNB Chain
        </p>

        <div className="bg-secondary-light p-8 rounded-xl border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Warning Banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-500 text-sm">
                ⚠️ <strong>Choose carefully</strong> - these can't be changed once the coin is created
              </p>
            </div>

            {/* Coin Details Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">Coin details</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Token Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., PumpBNB Coin"
                required
                className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="symbol" className="block text-sm font-medium mb-2">
                Token Symbol
              </label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., PUMP"
                required
                maxLength={10}
                className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="metadata" className="block text-sm font-medium mb-2">
                Metadata URI (Optional)
              </label>
              <input
                id="metadata"
                type="text"
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
                placeholder="ipfs://... (optional)"
                className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload token metadata to IPFS and paste the URI here
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-semibold mb-2">Token Distribution:</h3>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Supply:</span>
                <span className="font-mono">1,000,000,000 tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bonding Curve:</span>
                <span className="font-mono">800,000,000 (80%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Creator (locked):</span>
                <span className="font-mono">200,000,000 (20%)</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                <span className="text-gray-400">Graduation Threshold:</span>
                <span className="font-mono text-primary">100 ASTER</span>
              </div>
            </div>

            {!isConnected && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-yellow-500 text-sm">
                  Please connect your wallet to create a token
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-500 text-sm">
                  Error: {error.message}
                </p>
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-500 text-sm">
                  Token created successfully! Transaction: {hash}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isConnected || isPending || isConfirming}
              className="w-full bg-primary text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming ? 'Creating...' : 'Create Token (FREE)'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By creating a token, you agree that the token is for entertainment purposes.
              You are responsible for compliance with applicable laws.
            </p>
          </form>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Instant Trading</h3>
            <p className="text-sm text-gray-400">Start trading immediately after creation</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold mb-1">Fair Launch</h3>
            <p className="text-sm text-gray-400">No presale, everyone starts equal</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold mb-1">Auto Liquidity</h3>
            <p className="text-sm text-gray-400">Graduates to PancakeSwap at 100 ASTER</p>
          </div>
        </div>
      </div>
    </div>
  )
}
