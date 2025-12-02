'use client'

import { useState, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useRouter } from 'next/navigation'
import { CONTRACTS } from '@/lib/contracts/addresses'
import TokenFactoryABIImport from '@/lib/abis/TokenFactory.json'
import type { Abi } from 'viem'
import { formatUnits } from 'viem'

const TokenFactoryABI = TokenFactoryABIImport.abi as Abi

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
  const [showSocialLinks, setShowSocialLinks] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')

  const { data: hash, isPending, writeContract, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Pre-flight checks (factory address + virtual reserve)
  const { data: vrData, error: vrError, isLoading: vrLoading } = useReadContract({
    address: CONTRACTS.TOKEN_FACTORY as `0x${string}`,
    abi: TokenFactoryABI,
    functionName: 'virtualAsterReserve',
  })
  const expectedVR = 10000n * 10n ** 18n
  const vr = (vrData as bigint) || 0n
  const reserveOk = vr === expectedVR

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
      return data.data.ipfsHash || data.data.url || ''
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
      return `ipfs://${data.data.ipfsHash}`
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

      // Safety: block if factory is misconfigured
      if (!reserveOk) {
        alert('Factory misconfigured: virtualAsterReserve must be 10,000 ASTER. Please refresh or redeploy frontend.')
        return
      }

      // Create token on blockchain
      writeContract({
        address: CONTRACTS.TOKEN_FACTORY as `0x${string}`,
        abi: TokenFactoryABI,
        functionName: 'createToken',
        args: [name, symbol, metadataUri || ''],
      })
    } catch (err) {
      console.error('Error creating token:', err)
    }
  }

  // Index token immediately and redirect on success
  if (isSuccess && hash) {
    // Trigger immediate indexing in the background
    fetch(`${API_URL}/api/indexer/index-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash: hash }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Token indexed immediately:', data)
      })
      .catch(error => {
        console.error('Failed to index token immediately:', error)
        // Don't block user flow - background indexer will catch it later
      })

    // Redirect to home page with newToken param to trigger refresh
    setTimeout(() => {
      router.push('/?newToken=true')
    }, 2000)
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold mb-2">Create new coin</h1>
        <p className="text-gray-400 mb-8">
          Launch your meme coin in seconds on BNB Chain
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6 lg:gap-8">
          {/* Main Form - Left Side */}
          <div className="bg-secondary-light p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Factory Health Banner */}
              <div className={`rounded-lg p-4 border ${reserveOk && !vrError ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Factory Status</div>
                    <div className="text-gray-300">
                      Address: <span className="font-mono break-all">{CONTRACTS.TOKEN_FACTORY}</span>
                    </div>
                    <div className="text-gray-300">
                      virtualAsterReserve: {vrLoading ? 'loading…' : `${formatUnits(vr, 18)} ASTER`} (expected 10,000)
                    </div>
                    {vrError && (
                      <div className="text-red-400 mt-1">Error reading factory: {String((vrError as Error).message || vrError)}</div>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {reserveOk && !vrError ? (
                      <span className="text-green-500">✓ Ready</span>
                    ) : (
                      <span className="text-red-500">✗ Misconfigured — creation disabled</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-500 text-sm">
                  ⚠️ <strong>Choose carefully</strong> - these can't be changed once the coin is created
                </p>
              </div>

              {/* Coin Details Section */}
              <div>
                <h2 className="text-xl font-bold mb-4">Coin details</h2>

                {/* Name and Symbol - Stack on mobile, side by side on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Coin name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name your coin"
                      required
                      className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="symbol" className="block text-sm font-medium mb-2">
                      Ticker
                    </label>
                    <input
                      id="symbol"
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder="Add a coin ticker (e.g. DOGE)"
                      required
                      maxLength={10}
                      className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a short description"
                    rows={4}
                    className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none resize-none transition"
                  />
                </div>

                {/* Social Links - Collapsible */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowSocialLinks(!showSocialLinks)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-3"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${showSocialLinks ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Add social links <span className="text-gray-600">(Optional)</span>
                  </button>

                  {showSocialLinks && (
                    <div className="space-y-3 pl-2 sm:pl-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="website" className="block text-sm font-medium mb-2">
                            Website
                          </label>
                          <input
                            id="website"
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="Add URL"
                            className="w-full px-4 py-2 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="twitter" className="block text-sm font-medium mb-2">
                            X (Twitter)
                          </label>
                          <input
                            id="twitter"
                            type="url"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            placeholder="Add URL"
                            className="w-full px-4 py-2 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="telegram" className="block text-sm font-medium mb-2">
                            Telegram
                          </label>
                          <input
                            id="telegram"
                            type="url"
                            value={telegram}
                            onChange={(e) => setTelegram(e.target.value)}
                            placeholder="Add URL"
                            className="w-full px-4 py-2 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="discord" className="block text-sm font-medium mb-2">
                            Discord
                          </label>
                          <input
                            id="discord"
                            type="url"
                            value={discord}
                            onChange={(e) => setDiscord(e.target.value)}
                            placeholder="Add URL"
                            className="w-full px-4 py-2 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Coin image
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-[200px] max-h-[200px] mx-auto rounded-lg"
                        />
                        <p className="text-sm text-gray-400">
                          Click to change image
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-secondary rounded-lg flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium mb-1">
                            Select video or image to upload
                          </p>
                          <p className="text-sm text-gray-400">
                            or drag and drop it here
                          </p>
                        </div>
                        <button
                          type="button"
                          className="bg-primary text-black px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                        >
                          Log in
                        </button>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <p className="text-red-500 text-sm mt-2">{uploadError}</p>
                  )}

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                      <p className="font-semibold mb-1">File size and type</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Image - max 15mb, .jpg, .gif or .png recommended</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Resolution and aspect ratio</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Image - min 1000x1000px (1:1 square recommended)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Token Distribution Info */}
              <div className="bg-secondary rounded-lg p-4 space-y-2 text-sm">
                <h3 className="font-semibold mb-2">Token Distribution:</h3>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Supply:</span>
                  <span className="font-mono">1,000,000,000 tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bonding Curve:</span>
                  <span className="font-mono">1,000,000,000 (100%)</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                  <span className="text-gray-400">Graduation Threshold:</span>
                  <span className="font-mono text-primary">10,000 ASTER</span>
                </div>
              </div>

              {/* Status Messages */}
              {!isConnected && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                  <p className="text-yellow-500 text-sm">
                    Please connect your wallet to create a token
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-500 text-sm break-words overflow-wrap-anywhere">
                    {error.message.includes('User rejected') || error.message.includes('User denied')
                      ? 'Transaction cancelled - You rejected the transaction'
                      : `Error: ${error.message}`}
                  </p>
                </div>
              )}

              {isSuccess && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                  <p className="text-green-500 text-sm break-words">
                    Token created successfully! Redirecting to tokens page...
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isConnected || isPending || isConfirming || isUploadingImage || !reserveOk || !!vrError}
                className="w-full bg-primary text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingImage
                  ? 'Uploading image...'
                  : isPending || isConfirming
                  ? 'Creating...'
                  : 'Login to create coin'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Coin data (social links, banner, and coin) can only be added now, and can't be changed or edited after creation
              </p>
            </form>
          </div>

          {/* Preview Panel - Right Side */}
          <div className="bg-secondary-light p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-800 order-first lg:order-last">
            <h2 className="text-xl font-bold mb-4">Preview</h2>
            <div className="text-center text-gray-500">
              <p className="text-sm">
                A preview of how the coin will look like
              </p>
              {imagePreview && (
                <div className="mt-6">
                  <img
                    src={imagePreview}
                    alt="Coin preview"
                    className="w-32 h-32 mx-auto rounded-full border-4 border-gray-700"
                  />
                  <p className="mt-4 font-bold text-white">{name || 'Coin Name'}</p>
                  <p className="text-sm text-gray-400">{symbol || 'SYMBOL'}</p>
                  {description && (
                    <p className="mt-3 text-xs text-gray-400">{description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
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
            <p className="text-sm text-gray-400">Graduates to PancakeSwap at 10,000 ASTER</p>
          </div>
        </div>
      </div>
    </div>
  )
}
