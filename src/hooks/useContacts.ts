import { useMemo, useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { Contact } from "../types";
import { BackendClient } from "../services/api";

export function useContacts() {
  const { transactions } = useStore();
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    async function resolveAddresses() {
      if (!transactions || transactions.length === 0) return;

      const addressesToResolve = new Set<string>();
      transactions.forEach((tx) => {
        if (tx.type === "transfer" || tx.type === "payment") {
          const addr = tx.metadata?.destinationAddress;
          // If the name is missing or looks like an address/placeholder, we should resolve it
          if (
            addr &&
            (!tx.metadata?.recipientName ||
              tx.metadata.recipientName === "EVM Account" ||
              tx.metadata.recipientName.startsWith("0x"))
          ) {
            if (!resolvedNames[addr.toLowerCase()]) {
              addressesToResolve.add(addr);
            }
          }
        }
      });

      if (addressesToResolve.size === 0) return;

      const newResolved: Record<string, string> = { ...resolvedNames };

      // Resolve all addresses in parallel for performance
      const resolvePromises = Array.from(addressesToResolve).map(
        async (address) => {
          try {
            const data = await BackendClient.resolveAddress(address);
            if (data && (data.username || data.name)) {
              newResolved[address.toLowerCase()] =
                `@${data.username || data.name}`;
            } else {
              // Fallback for unregistered addresses: User_0x1234...ABCD
              const start = address.slice(0, 6);
              const end = address.slice(-4);
              newResolved[address.toLowerCase()] = `User_${start}...${end}`;
            }
          } catch (e) {
            // Fallback on error: User_0x1234...ABCD
            const start = address.slice(0, 6);
            const end = address.slice(-4);
            newResolved[address.toLowerCase()] = `User_${start}...${end}`;
          }
        },
      );

      await Promise.all(resolvePromises);

      setResolvedNames(newResolved);
    }

    resolveAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  const realContacts = useMemo(() => {
    // Generate contacts from transaction history - real data!
    const contactMap = new Map<string, Contact>();

    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        if (tx.type === "transfer" || tx.type === "payment") {
          const recipientAddress =
            tx.metadata?.destinationAddress ||
            (tx.type === "payment" ? tx.internal_ref : undefined);

          let baseName = tx.metadata?.recipientName;
          if (
            !baseName ||
            baseName === "EVM Account" ||
            baseName.startsWith("0x")
          ) {
            baseName = undefined;
          }

          let recipientName =
            resolvedNames[recipientAddress?.toLowerCase() || ""] ||
            baseName ||
            (tx.type === "payment"
              ? `Merchant ${tx.id.substring(0, 4)}`
              : recipientAddress
                ? `User_${recipientAddress.substring(0, 6)}...${recipientAddress.substring(recipientAddress.length - 4)}`
                : "Unknown");

          if (recipientAddress && recipientName) {
            const cleanAddr = recipientAddress.trim();
            const initials = recipientName.trim()
              ? recipientName
                  .replace(/@/g, "")
                  .replace(/User_/g, "")
                  .trim()
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
              : "??";

            contactMap.set(cleanAddr.toLowerCase(), {
              id: tx.id || cleanAddr,
              letter: recipientName.trim()[0]?.toUpperCase() || "?",
              name: recipientName.startsWith("@")
                ? recipientName
                : recipientName.toUpperCase(),
              network: "EVM (Arc Testnet)",
              number: cleanAddr,
              initials: initials,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientName)}&background=random`,
            });
          }
        }
      });
    }

    return Array.from(contactMap.values());
  }, [transactions, resolvedNames]);

  return { realContacts };
}
