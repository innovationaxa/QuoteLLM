import daLogoSrc from '../assets/da-logo.png';

interface Props {
  size?: number;
}

export function DALogo({ size = 32 }: Props) {
  return (
    <img
      src={daLogoSrc}
      alt="Direct Assurance"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: 6 }}
    />
  );
}
