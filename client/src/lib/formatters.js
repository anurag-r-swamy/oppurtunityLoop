export function formatDate(dateInput) {
  if (!dateInput) return 'Not specified';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDeadlineCountdown(deadline) {
  if (!deadline) return 'No deadline';
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function formatFee(amount, currency = 'INR') {
  if (!amount || amount <= 0) return 'Free';
  return `${currency === 'INR' ? '₹' : `${currency} `}${amount}`;
}

export function formatCategoryLabel(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

