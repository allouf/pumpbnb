'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-secondary text-white antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-secondary-light border border-red-500/50 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-500">Critical Error</h2>
            <p className="text-gray-400 mb-6">
              ASTER FUN encountered a critical error. Please reload the page.
            </p>
            <button
              onClick={reset}
              className="w-full bg-primary text-black px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
