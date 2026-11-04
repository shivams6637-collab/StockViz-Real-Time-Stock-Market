import React, { useEffect, useState } from "react";

const LOGO_PATHS = {
  RELIANCE: "/logos/reliance.svg",
  TCS: "/logos/tcs.svg",
  HDFCBANK: "/logos/hdfc.svg",
  INFY: "/logos/infosys.svg",
  ICICIBANK: "/logos/icici.svg",
  BHARTIARTL: "/logos/airtel.svg",
  TMPV: "/logos/tata.svg",
  TATAMOTORS: "/logos/tata.svg",
  TATAPOWER: "/logos/tata.svg",
  TATASTEEL: "/logos/tata.svg",
};

function CompanyLogo({
  symbol,
  name,
  size = "w-9 h-9",
  className = "",
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const baseSymbol = String(symbol || "")
    .replace(/\.(NS|BSE)$/i, "")
    .toUpperCase();
  const logoPath = LOGO_PATHS[baseSymbol];

  useEffect(() => {
    setLogoFailed(false);
  }, [logoPath]);

  const initials = (name || symbol || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={`sv-company-logo ${size} ${className}`.trim()}
      title={name || symbol}
      aria-label={`${name || symbol} logo`}
    >
      {logoPath && !logoFailed ? (
        <img
          key={logoPath}
          src={logoPath}
          alt=""
          onError={() => setLogoFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

export default CompanyLogo;
