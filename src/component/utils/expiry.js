import { formatDate } from './date';

// Notes expiring within this many days are shown as "use soon"
export const EXPIRING_SOON_DAYS = 30;

// Whole days from today to the expiry date (negative = already expired)
export const daysLeft = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = String(expiryDate).split('-').map(Number);
  return Math.round((new Date(year, month - 1, day) - today) / (1000 * 60 * 60 * 24));
};

export const isExpiringSoon = (expiryDate) => !!expiryDate && daysLeft(expiryDate) <= EXPIRING_SOON_DAYS;

// "Expired 3d ago" / "Expires today" / "12d left"
export const expiryLabel = (expiryDate) => {
  const days = daysLeft(expiryDate);
  if (days < 0) return `Expired ${-days}d ago`;
  if (days === 0) return 'Expires today';
  return `${days}d left`;
};

export const expiryText = (expiryDate) => `${formatDate(expiryDate)} (${expiryLabel(expiryDate)})`;
