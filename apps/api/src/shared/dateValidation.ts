/**
 * Financial Year helper for Indian business conventions (April 1 to March 31)
 */
export function getFinancialYear(dateInput: Date | string): { full: string; code: string } {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    const current = new Date();
    return getFinancialYear(current);
  }

  const month = d.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr
  const year = d.getFullYear();

  let startYear = year;
  let endYear = year + 1;

  if (month < 3) {
    // Jan, Feb, Mar belong to previous calendar year's FY
    startYear = year - 1;
    endYear = year;
  }

  const startYearShort = String(startYear).slice(-2);
  const endYearShort = String(endYear).slice(-2);

  return {
    full: `${startYear}-${endYear}`,
    code: `${startYearShort}-${endYearShort}`
  };
}

/**
 * Validates that order date is earlier than or equal to invoice date
 */
export function validateOrderInvoiceDates(
  orderDate?: string,
  invoiceDate?: string
): { valid: boolean; error?: string } {
  if (!invoiceDate) {
    return { valid: false, error: 'Invoice date is required.' };
  }

  const invDate = new Date(invoiceDate);
  if (isNaN(invDate.getTime())) {
    return { valid: false, error: 'Invalid invoice date format.' };
  }

  if (orderDate) {
    const ordDate = new Date(orderDate);
    if (isNaN(ordDate.getTime())) {
      return { valid: false, error: 'Invalid order date format.' };
    }

    // Compare date parts only (ignore time)
    const invDateOnly = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate());
    const ordDateOnly = new Date(ordDate.getFullYear(), ordDate.getMonth(), ordDate.getDate());

    if (ordDateOnly > invDateOnly) {
      return {
        valid: false,
        error: 'Order date must be earlier than or equal to the invoice date.'
      };
    }
  }

  return { valid: true };
}

/**
 * Formats a date into DD-MM-YYYY
 */
export function formatDateDDMMYYYY(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
