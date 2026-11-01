// TMDB dates are bare "YYYY-MM-DD" strings. `new Date("YYYY-MM-DD")` parses
// them as UTC midnight, which renders as the previous day west of UTC — so
// read the year straight off the string and build full dates in local time.

export function releaseYear(date: string): string {
  return date.slice(0, 4);
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}
