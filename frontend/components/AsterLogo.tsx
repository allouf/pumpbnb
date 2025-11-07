interface AsterLogoProps {
  size?: number
  className?: string
}

export function AsterLogo({ size = 20, className = "" }: AsterLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ASTER Star Symbol */}
      <path 
        d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z" 
        fill="#00D4FF" 
        stroke="#00B8E6" 
        strokeWidth="0.5"
      />
      {/* Inner highlight */}
      <path 
        d="M12 5L13.5 9.5L18 10L15 13L15.75 17.5L12 15.5L8.25 17.5L9 13L6 10L10.5 9.5L12 5Z" 
        fill="#66E0FF" 
        opacity="0.7"
      />
    </svg>
  )
}