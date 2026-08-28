// Bundesliga seasons run August–May, so before July we're still in the
// previous year's season (e.g. March 2026 is part of season 2025).
export const getCurrentSeason = (): number => {
  const now = new Date();
  return now.getMonth() > 6 ? now.getFullYear() : now.getFullYear() - 1;
};
