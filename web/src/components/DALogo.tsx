interface Props {
  size?: number;
}

// Direct Assurance logo: red rounded-square bg + 3 white squares in decreasing diagonal
export function DALogo({ size = 32 }: Props) {
  const r = size * 0.22; // corner radius
  // Square sizes and positions (relative to 100-unit viewBox)
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Red background */}
      <rect width="100" height="100" rx="22" fill="#D8311B" />
      {/* Large white square — top-left */}
      <rect x="14" y="14" width="42" height="42" rx="5" fill="white" />
      {/* Medium white square — centre */}
      <rect x="36" y="36" width="28" height="28" rx="4" fill="white" />
      {/* Small white square — bottom-right */}
      <rect x="56" y="56" width="18" height="18" rx="3" fill="white" />
    </svg>
  );
}
