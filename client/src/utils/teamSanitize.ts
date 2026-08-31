import Leverkusen from '../assets/images/leverkusen-icon.png';
import Union from '../assets/images/union-icon.png';
import type { BundesligaTableEntry, Team } from '../types';

// openligadb serves these teams' icons from domains that aren't in the CSP
// imgSrc allowlist (see helmet config in app.js), so the browser blocks them
// in production — serve a local copy instead. Keyed by openligadb's team id,
// which the matches endpoint calls teamId and the table endpoint teamInfoId.
const ICON_OVERRIDES: Record<number, string> = {
  80: Union, // 1. FC Union Berlin
  6: Leverkusen, // Bayer 04 Leverkusen
};

const teamSanitization = (team1: Team, team2: Team): void => {
  for (const team of [team1, team2]) {
    const override = ICON_OVERRIDES[team.teamId];
    if (override) {
      team.teamIconUrl = override;
    }
  }
};

export const tableSanitization = (entries: BundesligaTableEntry[]): void => {
  for (const entry of entries) {
    const override = ICON_OVERRIDES[entry.teamInfoId];
    if (override) {
      entry.teamIconUrl = override;
    }
  }
};

export default teamSanitization;
