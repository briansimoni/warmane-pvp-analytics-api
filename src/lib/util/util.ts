export function isMoreThan30DaysAgo(date: Date) {
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;
  return Date.now() - date.getTime() > thirtyDays;
}
