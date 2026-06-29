export const usdCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

export function formatUsdCents(value) {
  return usdCurrencyFormatter.format((value || 0) / 100);
}
