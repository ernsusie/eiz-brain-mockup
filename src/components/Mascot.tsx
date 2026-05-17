import { useState } from 'react'

interface Props {
  size?: number
  className?: string
}

/**
 * EizBrain mascot — tries to load /mascot.png first (save the 3D image there
 * for best look), falls back to inline SVG approximation.
 */
export const Mascot = ({ size = 100, className }: Props) => {
  const [imgError, setImgError] = useState(false)

  if (!imgError) {
    return (
      <img
        src="/mascot.png"
        alt="EizBrain mascot"
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain' }}
        onError={() => setImgError(true)}
      />
    )
  }

  return <SvgMascot size={size} className={className} />
}

const SvgMascot = ({ size = 100, className }: Props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    width={size}
    height={size}
    className={className}
    aria-hidden
  >
    <defs>
      <radialGradient id="m-head" cx="0.42" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#ffb070" />
        <stop offset="0.6" stopColor="#ff7a00" />
        <stop offset="1" stopColor="#e85a00" />
      </radialGradient>
      <radialGradient id="m-eye" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fffaf3" />
        <stop offset="1" stopColor="#fff" />
      </radialGradient>
      <radialGradient id="m-pupil" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#7a4a25" />
        <stop offset="1" stopColor="#3d2817" />
      </radialGradient>
    </defs>

    {/* Hair spikes (5 flame-like) */}
    <g fill="#ff7a00">
      <path d="M55 65 Q60 30 75 55 Q72 30 88 50 Z" />
      <path d="M75 55 Q88 18 100 50 Q92 18 110 48 Z" />
      <path d="M95 50 Q108 10 122 48 Q115 10 132 50 Z" />
      <path d="M115 48 Q128 18 138 55 Q132 22 148 58 Z" />
      <path d="M135 55 Q145 30 152 65 Q150 35 162 68 Z" />
    </g>

    {/* Head */}
    <ellipse cx="100" cy="120" rx="78" ry="72" fill="url(#m-head)" />

    {/* Cheeks (subtle) */}
    <ellipse cx="55" cy="135" rx="14" ry="9" fill="#ff5722" opacity="0.25" />
    <ellipse cx="145" cy="135" rx="14" ry="9" fill="#ff5722" opacity="0.25" />

    {/* Glasses frames */}
    <g stroke="#3d2817" strokeWidth="5" fill="url(#m-eye)">
      <circle cx="73" cy="115" r="24" />
      <circle cx="127" cy="115" r="24" />
    </g>
    <line x1="97" y1="115" x2="103" y2="115" stroke="#3d2817" strokeWidth="5" />

    {/* Pupils */}
    <circle cx="76" cy="118" r="11" fill="url(#m-pupil)" />
    <circle cx="130" cy="118" r="11" fill="url(#m-pupil)" />
    {/* Eye shine */}
    <circle cx="80" cy="113" r="3.5" fill="white" />
    <circle cx="134" cy="113" r="3.5" fill="white" />
    <circle cx="73" cy="123" r="1.5" fill="white" opacity="0.7" />
    <circle cx="127" cy="123" r="1.5" fill="white" opacity="0.7" />

    {/* Beak */}
    <path
      d="M100 145 L92 158 Q100 162 108 158 Z"
      fill="#e85a00"
      stroke="#cc4f00"
      strokeWidth="1"
    />
    <path d="M100 148 Q97 156 100 158 Q103 156 100 148 Z" fill="#a83d00" opacity="0.4" />

    {/* Mouth (open smile) */}
    <path
      d="M75 158 Q100 192 125 158 Q100 175 75 158 Z"
      fill="#4a1605"
    />
    {/* Tongue */}
    <ellipse cx="100" cy="175" rx="14" ry="6" fill="#c2410c" />
    {/* Teeth highlight */}
    <path d="M82 162 Q100 167 118 162" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
  </svg>
)
