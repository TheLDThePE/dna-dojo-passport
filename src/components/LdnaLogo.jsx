export default function LdnaLogo({ className = 'h-12 w-auto' }) {
  return (
    <svg
      viewBox="0 0 224 92"
      className={className}
      role="img"
      aria-label="LDNA Dojo"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* L */}
      <path
        fill="#ffffff"
        d="M12 7h13v37h23v11H12z"
      />

      {/* D (evenodd เจาะช่องว่างตรงกลาง) */}
      <path
        fill="#ffffff"
        fillRule="evenodd"
        d="M55 7h21c13.5 0 23.5 11 23.5 24s-10 24-23.5 24H55V7zm13 11v26h7.5c6.5 0 10.5-4.5 10.5-13s-4-13-10.5-13H68z"
      />

      {/* N */}
      <path
        fill="#ffffff"
        d="M107 7h12l18.5 28.5V7H149v48h-12L118.5 26.5V55H107z"
      />

      {/* A (ทรงจั่วไม่มีคานแนวนอน) */}
      <path
        fill="#ffffff"
        d="M178 7h7l24 48h-13.5l-14-26.5L167.5 55H154z"
      />

      {/* สามเหลี่ยมสีแดงตรงกลางฐานตัว A */}
      <path
        fill="#ef2b2d"
        d="M181.5 36.5 192.5 55h-22z"
      />

      {/* เส้นแดงสองข้าง Dojo */}
      <rect x="28" y="77" width="40" height="3" fill="#ef2b2d" />
      <rect x="156" y="77" width="40" height="3" fill="#ef2b2d" />

      {/* Dojo */}
      <text
        x="112"
        y="84.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="21"
        fontWeight="700"
        letterSpacing="3"
        fontFamily="Montserrat, system-ui, -apple-system, 'Segoe UI', sans-serif"
      >
        Dojo
      </text>
    </svg>
  )
}
