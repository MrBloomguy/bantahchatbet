import React, { useMemo } from 'react';
import * as Ably from 'ably';

// Example usage for Ably client creation
export function useAblyClient(apiKey: string, clientId: string) {
  return useMemo(() => {
    if (!apiKey) return null;
    return new Ably.Realtime.Promise({ key: apiKey, clientId });
  }, [apiKey, clientId]);
}
