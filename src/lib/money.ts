export const KOBO_PER_NAIRA = 100;

export function nairaToKobo(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Money amounts must be finite, non-negative numbers');
  }

  return Math.round((amount + Number.EPSILON) * KOBO_PER_NAIRA);
}

export function koboToNaira(amountKobo: number): number {
  if (!Number.isSafeInteger(amountKobo) || amountKobo < 0) {
    throw new Error('Kobo amounts must be non-negative safe integers');
  }

  return amountKobo / KOBO_PER_NAIRA;
}

export function calculatePercentageKobo(amountKobo: number, percentage: number): number {
  if (!Number.isSafeInteger(amountKobo) || amountKobo < 0) {
    throw new Error('Kobo amounts must be non-negative safe integers');
  }
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }

  return Math.round((amountKobo * percentage) / 100);
}
