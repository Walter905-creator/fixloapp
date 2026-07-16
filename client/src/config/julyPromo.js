/**
 * July 2026 Promotional Campaign Configuration
 *
 * 🎉 July Special — 50% OFF Fixlo Pro Membership for the rest of July!
 *
 * Original price: $179.99/month
 * Promo price:    $89.99/month
 * Savings:        $90.00/month
 * Offer expires:  July 31, 2026 at 11:59 PM (user's local timezone)
 */

export const JULY_PROMO = {
  /** Display label */
  label: 'Limited-Time July Offer',

  /** Promo expiry: end of July 31, 2026 in the user's local timezone */
  expiryDate: new Date(2026, 6, 31, 23, 59, 59), // month is 0-indexed → 6 = July

  /** Original monthly price (Fixlo Pro Membership) */
  originalPrice: 179.99,
  originalPriceFormatted: '$179.99',

  /** Promotional monthly price (50% off) */
  promoPrice: 89.99,
  promoPriceFormatted: '$89.99',

  /** Savings amount */
  savings: 90.0,
  savingsFormatted: '$90.00',

  /** Discount percentage */
  discountPercent: 50,

  /** Human-readable offer summary */
  headline: 'Get 50% OFF Fixlo Pro Membership for the rest of July!',
  subHeadline: 'Join before July 31 and save 50% on your first month.',
  urgency: 'Offer ends July 31 at 11:59 PM',
};

/**
 * Returns true if the July promotion is currently active (before expiry).
 */
export function isJulyPromoActive() {
  return new Date() < JULY_PROMO.expiryDate;
}

/**
 * Returns milliseconds remaining until the promo expires.
 * Returns 0 if already expired.
 */
export function getPromoMsRemaining() {
  const remaining = JULY_PROMO.expiryDate - new Date();
  return remaining > 0 ? remaining : 0;
}

/**
 * Returns a structured object with days, hours, minutes, seconds remaining.
 */
export function getPromoTimeRemaining() {
  const ms = getPromoMsRemaining();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, expired: false };
}
