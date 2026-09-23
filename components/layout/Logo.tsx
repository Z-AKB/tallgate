import Link from "next/link"

interface LogoProps {
  variant?: "light" | "dark"
  className?: string
  width?: number
  height?: number
  showWordmark?: boolean
}

export default function Logo({
  variant = "light",
  className = "",
  width = 180,
  height = 44,
  showWordmark = true,
}: LogoProps) {
  const isLight = variant === "light"
  const primaryColor = isLight ? "#FFFFFF" : "#061A4F"
  const accentColor = isLight ? "#818CF8" : "#202DB8"

  return (
    <Link
      href="/"
      prefetch={true}
      className={`inline-flex items-center group select-none transition-opacity hover:opacity-95 ${className}`}
      aria-label="TallGate Limited Home"
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 240 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-9 sm:h-10 w-auto"
      >
        {/* ==================================================================== */}
        {/* 1. ICON MARK (Viewfinder & Overlapping Geometric Focus Squares)     */}
        {/* ==================================================================== */}
        <g transform="translate(4, 4)">
          {/* Outer Viewfinder Corner Brackets */}
          {/* Top-Left */}
          <path
            d="M2 14V4C2 2.89543 2.89543 2 4 2H14"
            stroke={primaryColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Top-Right */}
          <path
            d="M34 2H44C45.1046 2 46 2.89543 46 4V14"
            stroke={primaryColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Bottom-Left */}
          <path
            d="M2 34V44C2 45.1046 2.89543 46 4 46H14"
            stroke={primaryColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Bottom-Right */}
          <path
            d="M34 46H44C45.1046 46 46 45.1046 46 44V34"
            stroke={primaryColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Overlapping Offset Solid Rectangles */}
          <rect
            x="9"
            y="9"
            width="22"
            height="22"
            fill={primaryColor}
            rx="1.5"
          />
          <rect
            x="17"
            y="17"
            width="22"
            height="22"
            fill={primaryColor}
            rx="1.5"
          />

          {/* Center Cutout Box */}
          <rect
            x="18"
            y="18"
            width="12"
            height="12"
            fill={isLight ? "#09091A" : "#FFFFFF"}
            rx="1"
          />

          {/* Center Mini Accent Square */}
          <rect
            x="22"
            y="22"
            width="4"
            height="4"
            fill={accentColor}
            rx="0.5"
          />
        </g>

        {/* ==================================================================== */}
        {/* 2. WORDMARK: "TALLGATE" + "LIMITED"                                 */}
        {/* ==================================================================== */}
        {showWordmark && (
          <g transform="translate(62, 0)">
            {/* Top Line: TALLGATE */}
            <text
              x="0"
              y="26"
              fill={primaryColor}
              fontFamily="var(--font-inter), system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="24"
              letterSpacing="0.06em"
            >
              TALLGATE
            </text>

            {/* Bottom Line: LIMITED */}
            <text
              x="0"
              y="48"
              fill={primaryColor}
              fontFamily="var(--font-inter), system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="20"
              letterSpacing="0.14em"
            >
              LIMITED
            </text>
          </g>
        )}
      </svg>
    </Link>
  )
}
