import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const getMatches = (): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    function handleChange() {
      setMatches(mediaQuery.matches);
    }

    // Set initial value
    handleChange();

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
