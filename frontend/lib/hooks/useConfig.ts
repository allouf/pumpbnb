'use client'

import { useState, useEffect } from 'react'
import { getConfig, PlatformConfig } from '../config'

/**
 * React hook to fetch and use platform configuration
 * Automatically fetches config on mount and provides loading/error states
 */
export function useConfig() {
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        setIsLoading(true)
        setError(null)

        const platformConfig = await getConfig()
        setConfig(platformConfig)
      } catch (err) {
        console.error('Error fetching config:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return {
    config,
    isLoading,
    error,
    // Helper properties for easy access
    contracts: config?.contracts || null,
    chainId: config?.chainId || null,
    networkName: config?.networkName || null,
  }
}
