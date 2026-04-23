/**
 * Centralized branding and UI utilities for TimbroSmart.
 */

/**
 * Applies the company branding to the document.
 */
export function applyBranding(primaryColor: string | null) {
  if (typeof window === 'undefined') return;
  
  if (primaryColor) {
    document.documentElement.style.setProperty('--primary', primaryColor);
    // You could also calculate variations here if needed
  }
}

/**
 * Formats a date string into a localized Italian format.
 */
export function formatLongDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function formatShortDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

/**
 * Formats a currency amount in EUR.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Returns the day and month name for calendar display.
 */
export function getItalianMonth(date: Date): string {
  const months = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  return months[date.getMonth()];
}
