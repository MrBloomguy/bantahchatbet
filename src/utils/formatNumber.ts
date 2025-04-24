/**
 * Formats a number to a compact representation (e.g., 5k, 10k, 1M)
 * @param value The number to format
 * @param decimals The number of decimal places to show (default: 2)
 * @returns Formatted string
 */
export function formatCompactNumber(value: number, decimals: number = 2): string {
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  
  if (absValue < 1000) {
    return value.toString();
  } else if (absValue < 1000000) {
    // Format as K (thousands)
    const formattedValue = (value / 1000).toFixed(decimals);
    // Remove trailing zeros and decimal point if not needed
    const cleanValue = parseFloat(formattedValue).toString();
    // If it's a whole number after division, don't show decimal places
    return cleanValue.includes('.') ? `${cleanValue}K` : `${cleanValue}K`;
  } else if (absValue < 1000000000) {
    // Format as M (millions)
    const formattedValue = (value / 1000000).toFixed(decimals);
    const cleanValue = parseFloat(formattedValue).toString();
    return cleanValue.includes('.') ? `${cleanValue}M` : `${cleanValue}M`;
  } else {
    // Format as B (billions)
    const formattedValue = (value / 1000000000).toFixed(decimals);
    const cleanValue = parseFloat(formattedValue).toString();
    return cleanValue.includes('.') ? `${cleanValue}B` : `${cleanValue}B`;
  }
}

/**
 * Formats a currency value with the given currency symbol
 * @param value The number to format
 * @param currency The currency symbol (default: '₦')
 * @param compact Whether to use compact formatting (default: false)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = '₦', compact: boolean = false): string {
  if (compact) {
    return `${currency}${formatCompactNumber(value)}`;
  }
  
  return `${currency}${value.toLocaleString()}`;
}
