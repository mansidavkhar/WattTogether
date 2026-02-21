// USDC and EUR Conversion Utility
// 1 INR = 0.012 USDC (same as backend)
// 1 INR = 0.011 EUR (approximate rate as of 2026)

export const INR_TO_USDC_RATE = 0.012;
export const INR_TO_EUR_RATE = 0.011;

/**
 * Convert INR amount to USDC
 * @param {number} inrAmount - Amount in INR
 * @returns {number} - Amount in USDC (2 decimal places)
 */
export const convertINRtoUSDC = (inrAmount) => {
  if (!inrAmount || isNaN(inrAmount)) return 0;
  return parseFloat((inrAmount * INR_TO_USDC_RATE).toFixed(2));
};

/**
 * Convert INR amount to EUR
 * @param {number} inrAmount - Amount in INR
 * @returns {number} - Amount in EUR (2 decimal places)
 */
export const convertINRtoEUR = (inrAmount) => {
  if (!inrAmount || isNaN(inrAmount)) return 0;
  return parseFloat((inrAmount * INR_TO_EUR_RATE).toFixed(2));
};

/**
 * Convert USDC amount to INR
 * @param {number} usdcAmount - Amount in USDC
 * @returns {number} - Amount in INR (2 decimal places)
 */
export const convertUSDCtoINR = (usdcAmount) => {
  if (!usdcAmount || isNaN(usdcAmount)) return 0;
  return parseFloat((usdcAmount / INR_TO_USDC_RATE).toFixed(2));
};

/**
 * Format currency with symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - 'INR' or 'USDC'
 * @returns {string} - Formatted string
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (!amount || isNaN(amount)) return currency === 'INR' ? '₹0' : '$0';
  
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return currency === 'INR' ? `₹${formatted}` : `$${formatted}`;
};

/**
 * Display dual currency (INR + USDC)
 * @param {number} inrAmount - Amount in INR
 * @returns {string} - "₹X,XXX ($YY.YY USDC)"
 */
export const displayDualCurrency = (inrAmount) => {
  const usdcAmount = convertINRtoUSDC(inrAmount);
  return `${formatCurrency(inrAmount, 'INR')} ($${usdcAmount.toFixed(2)} USDC)`;
};

/**
 * Display triple currency (INR + USDC + EUR)
 * @param {number} inrAmount - Amount in INR
 * @returns {string} - "₹X,XXX ($YY.YY / €ZZ.ZZ)"
 */
export const displayTripleCurrency = (inrAmount) => {
  const usdcAmount = convertINRtoUSDC(inrAmount);
  const eurAmount = convertINRtoEUR(inrAmount);
  return `${formatCurrency(inrAmount, 'INR')} ($${usdcAmount.toFixed(2)} / €${eurAmount.toFixed(2)})`;
};
