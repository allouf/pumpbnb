'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, AreaSeries } from 'lightweight-charts'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'

interface PriceChartProps {
  bondingCurveAddress: string
  tokenSymbol: string
}

export function PriceChart({ bondingCurveAddress, tokenSymbol }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<any>(null)
  const { transactions, isLoading } = useTransactionHistory(bondingCurveAddress)

  console.log(`[PriceChart] Rendering with ${transactions.length} transactions, isLoading: ${isLoading}`)

  useEffect(() => {
    if (!chartContainerRef.current || isLoading || transactions.length === 0) {
      console.log('[PriceChart] Skipping chart render:', {
        hasContainer: !!chartContainerRef.current,
        isLoading,
        transactionCount: transactions.length
      })
      return
    }

    console.log('[PriceChart] Creating chart with transactions:', transactions)

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1E2329' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#2B3139' },
        horzLines: { color: '#2B3139' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Add area series using v5 API
    const series = chart.addSeries(AreaSeries, {
      lineColor: '#F0B90B',
      topColor: 'rgba(240, 185, 11, 0.4)',
      bottomColor: 'rgba(240, 185, 11, 0.0)',
      lineWidth: 2,
    })

    seriesRef.current = series

    // Process transactions into price points
    // Price = ASTER amount / Token amount
    const priceData = transactions
      .filter(tx => tx.timestamp > 0) // Only transactions with timestamps
      .map(tx => {
        const asterAmount = Number(tx.asterAmountFormatted)
        const tokenAmount = Number(tx.tokenAmountFormatted)
        const price = tokenAmount > 0 ? asterAmount / tokenAmount : 0

        console.log('[PriceChart] Processing transaction:', {
          timestamp: tx.timestamp,
          asterAmount,
          tokenAmount,
          price,
        })

        return {
          time: Math.floor(tx.timestamp), // Ensure integer timestamp
          value: price,
        }
      })
      .sort((a, b) => a.time - b.time) // Sort by time ascending

    console.log('[PriceChart] Price data for chart:', priceData)

    // Set data
    if (priceData.length > 0) {
      try {
        series.setData(priceData)
        chart.timeScale().fitContent()
        console.log('[PriceChart] Chart data set successfully')
      } catch (error) {
        console.error('[PriceChart] Error setting chart data:', error)
      }
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [transactions, isLoading, bondingCurveAddress])

  if (isLoading) {
    return (
      <div className="bg-secondary-light rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Price Chart</h2>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-400">Loading chart data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Price Chart</h2>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400">No trading data available yet</p>
            <p className="text-sm text-gray-500 mt-2">Chart will appear after first trade</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-secondary-light rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Price Chart</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">{tokenSymbol}/ASTER</span>
          <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-semibold">
            {transactions.length} trades
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
