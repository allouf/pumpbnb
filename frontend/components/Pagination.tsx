'use client'

import { useState } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
  className?: string
  isLoading?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 20, 50, 100],
  className = "",
  isLoading = false
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5 // Show max 5 page numbers
    
    if (totalPages <= showPages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Smart pagination with ellipsis
      if (currentPage <= 3) {
        // Show: 1 2 3 4 5 ... last
        for (let i = 1; i <= Math.min(5, totalPages); i++) {
          pages.push(i)
        }
        if (totalPages > 5) {
          pages.push('...')
          pages.push(totalPages)
        }
      } else if (currentPage >= totalPages - 2) {
        // Show: 1 ... (last-4) (last-3) (last-2) (last-1) last
        pages.push(1)
        pages.push('...')
        for (let i = Math.max(totalPages - 4, 1); i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Show: 1 ... (current-1) current (current+1) ... last
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  if (totalPages <= 1) {
    return null // Don't show pagination if there's only one page
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}>
      {/* Items info and per-page selector */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span>
          Showing {startItem}-{endItem} of {totalItems} items
        </span>
        
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span>Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              disabled={isLoading}
              className="bg-secondary border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
                     bg-secondary text-gray-400 hover:bg-secondary-light hover:text-white
                     disabled:hover:bg-secondary disabled:hover:text-gray-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="px-3 py-1.5 text-sm text-gray-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                  currentPage === page
                    ? 'bg-primary text-black'
                    : 'bg-secondary text-gray-400 hover:bg-secondary-light hover:text-white'
                }`}
              >
                {page}
              </button>
            )}
          </div>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
                     bg-secondary text-gray-400 hover:bg-secondary-light hover:text-white
                     disabled:hover:bg-secondary disabled:hover:text-gray-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Loading skeleton for pagination
export function PaginationSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-6 w-16 bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  )
}