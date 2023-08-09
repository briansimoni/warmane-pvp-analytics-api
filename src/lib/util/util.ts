// this could be shorter but it costs me money to write to Dynamo
export function isLessThan180DaysAgo(date: Date) {
  const thirtyDays = 1000 * 60 * 60 * 24 * 180;
  return Date.now() - date.getTime() < thirtyDays;
}
