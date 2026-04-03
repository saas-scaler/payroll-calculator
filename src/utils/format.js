/**
 * Format a number as GBP currency: £X,XXX
 * Negative values shown in red parentheses style: (£1,234)
 */
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '£0';
  const absVal = Math.abs(Math.round(value * 100) / 100);
  const formatted = '£' + absVal.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  if (value < -0.5) {
    return `(${formatted})`;
  }
  return formatted;
}

/**
 * Format a decimal as a percentage with 1 decimal place
 */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0.0%';
  return (value * 100).toFixed(1) + '%';
}

/**
 * Parse a comma-formatted string to a number
 */
export function parseNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleaned = str.replace(/[,£\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Format a number with commas for display in inputs
 */
export function formatNumberInput(value) {
  if (value == null || value === '' || isNaN(value)) return '';
  return Math.round(value).toLocaleString('en-GB');
}
