const pad = (n) => String(n).padStart(2, '0');

// Formats any backend date as dd-mm-yyyy.
// "yyyy-mm-dd" (LocalDate) is split directly so the day never shifts with the timezone.
export const formatDate = (value) => {
  if (!value) return '-';

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

// dd-mm-yyyy hh:mm (24h, local time)
export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Value for <input type="datetime-local"> (yyyy-mm-ddThh:mm in local time)
export const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
