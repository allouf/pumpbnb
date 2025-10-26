'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: '#2B3139',
          color: '#fff',
          border: '1px solid #3b414b',
        },
        success: {
          iconTheme: {
            primary: '#F0B90B',
            secondary: '#1E2329',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1E2329',
          },
        },
      }}
    />
  )
}
