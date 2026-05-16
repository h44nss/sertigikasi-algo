import React from 'react'
import { User } from 'lucide-react'

interface AvatarImageProps {
  src: string | null | undefined
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { container: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-xs' },
  md: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs' },
  lg: { container: 'w-24 h-24', icon: 'w-12 h-12', text: 'text-2xl' },
}

/**
 * Single source of truth for rendering user avatars.
 * Shows photo if avatar_url exists, otherwise falls back to initials or User icon.
 */
const AvatarImage: React.FC<AvatarImageProps> = ({ src, name, size = 'md', className = '' }) => {
  const s = sizeMap[size]

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={`${s.container} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  if (name) {
    return (
      <div className={`${s.container} bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}>
        <span className={`font-bold text-white ${s.text}`}>
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <div className={`${s.container} bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}>
      <User className={`${s.icon} text-blue-600`} />
    </div>
  )
}

export default AvatarImage
