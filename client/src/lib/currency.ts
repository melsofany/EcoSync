/**
 * Currency utilities for the Al-Khedawi system
 * Default currency: Egyptian Pound (EGP)
 */

export const formatCurrency = (amount: number | string, currency: string = "EGP") => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `0.00 ${currency}`;
  }

  // Format number with thousands separator and 2 decimal places
  const formattedAmount = numAmount.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formattedAmount} ${currency}`;
};

export const formatEGP = (amount: number | string) => {
  return formatCurrency(amount, "EGP");
};

export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbol and spaces, then parse
  const cleanString = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(cleanString) || 0;
};

export const CURRENCIES = {
  EGP: {
    code: "EGP",
    symbol: "ج.م",
    name: "جنيه مصري",
    nameEn: "Egyptian Pound"
  },
  USD: {
    code: "USD", 
    symbol: "$",
    name: "دولار أمريكي",
    nameEn: "US Dollar"
  },
  EUR: {
    code: "EUR",
    symbol: "€", 
    name: "يورو",
    nameEn: "Euro"
  }
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const getCurrencySymbol = (code: CurrencyCode): string => {
  return CURRENCIES[code]?.symbol || code;
};

export const getCurrencyName = (code: CurrencyCode): string => {
  return CURRENCIES[code]?.name || code;
};