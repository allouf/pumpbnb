interface AsterLogoProps {
  size?: number
  className?: string
  useImage?: boolean
}

export function AsterLogo({ size = 20, className = "", useImage = true }: AsterLogoProps) {
  if (useImage) {
    return (
      <img 
        src="/aster.svg" 
        alt="ASTER" 
        width={size} 
        height={size} 
        className={`rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  // Fallback to inline SVG
  return (
    <div 
      className={`rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ASTER Star Symbol - Optimized for small sizes */}
      <svg 
        width={size * 0.6} 
        height={size * 0.6} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z" 
          fill="white" 
          stroke="white" 
          strokeWidth="0.5"
        />
      </svg>
    </div>
  )
}
