const ones = [
  '',
  'ONE',
  'TWO',
  'THREE',
  'FOUR',
  'FIVE',
  'SIX',
  'SEVEN',
  'EIGHT',
  'NINE',
  'TEN',
  'ELEVEN',
  'TWELVE',
  'THIRTEEN',
  'FOURTEEN',
  'FIFTEEN',
  'SIXTEEN',
  'SEVENTEEN',
  'EIGHTEEN',
  'NINETEEN'
];

const tens = [
  '',
  '',
  'TWENTY',
  'THIRTY',
  'FORTY',
  'FIFTY',
  'SIXTY',
  'SEVENTY',
  'EIGHTY',
  'NINETY'
];

function convertLessThanThousand(num: number): string {
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' HUNDRED ';
    num %= 100;
    if (num > 0) {
      str += 'AND ';
    }
  }

  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }

  if (num > 0) {
    str += ones[num] + ' ';
  }

  return str.trim();
}

/**
 * Converts a positive number to Indian Currency words
 * Format: "RUPEES SIXTEEN THOUSAND TWO HUNDRED AND EIGHTY FOUR ONLY"
 */
export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'RUPEES ZERO ONLY';
  }

  // Round to 2 decimals
  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  let num = integerPart;
  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const remainder = num;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + ' CRORE ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' LAKH ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' THOUSAND ';
  }
  if (remainder > 0) {
    words += convertLessThanThousand(remainder) + ' ';
  }

  words = words.trim();
  let result = `RUPEES ${words}`;

  if (decimalPart > 0) {
    result += ` AND ${convertLessThanThousand(decimalPart)} PAISE`;
  }

  result += ' ONLY';
  return result.replace(/\s+/g, ' ');
}
