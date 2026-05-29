import { useState, useEffect } from "react";
import { syncTokenWithArcScan } from "../lib/arcRegistry";

export function useArcScanToken(contractAddress?: string, symbol?: string) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check local registry first
    const localMatch = symbol
      ? syncTokenWithArcScan(contractAddress, symbol)
      : null;
    if (localMatch?.logoUrl) {
      setLogoUrl(localMatch.logoUrl);
      return;
    }

    if (!contractAddress || contractAddress === "native") {
      return;
    }

    let isMounted = true;

    // Fetch dynamically from Arcscan API
    const fetchFromExplorer = async () => {
      try {
        const res = await fetch(
          `https://testnet.arcscan.app/api/v2/tokens/${contractAddress}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data?.icon_url) {
          setLogoUrl(data.icon_url);
        }
      } catch (err) {
        // Silently fail if not found
      }
    };

    fetchFromExplorer();

    return () => {
      isMounted = false;
    };
  }, [contractAddress, symbol]);

  return { logoUrl };
}
