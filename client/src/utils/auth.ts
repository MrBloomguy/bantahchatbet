/**
 * Converts a Privy DID to a UUID in a deterministic way
 */
export function privyDIDtoUUID(id: string): string {
  if (!id) return id;
  
  // If it's already a UUID, return as is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }

  // For Privy DIDs, create a deterministic UUID using a simple hashing algorithm
  const hash = Array.from(id)
    .reduce((acc, char) => {
      // Simple hash function that works in both Node.js and browser
      const hashCode = (acc << 5) - acc + char.charCodeAt(0);
      return hashCode & hashCode; // Convert to 32-bit integer
    }, 0)
    .toString(16)
    .padStart(32, '0');

  // Format as UUID
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}