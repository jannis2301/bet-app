import { describe, expect, it } from 'vitest';
import type { Team } from '../types';
import teamSanitization from './teamSanitize';

const team = (teamId: number, teamIconUrl: string): Team => ({
  teamId,
  shortName: 'X',
  teamIconUrl,
});

describe('teamSanitization', () => {
  it('replaces the icon URL for teams whose CDN is blocked by CSP', () => {
    const union = team(80, 'https://assets.dfb.de/union.jpg');
    const other = team(7, 'https://upload.wikimedia.org/bvb.svg');

    teamSanitization(union, other);

    expect(union.teamIconUrl).not.toBe('https://assets.dfb.de/union.jpg');
    expect(other.teamIconUrl).toBe('https://upload.wikimedia.org/bvb.svg');
  });

  it('fixes both teams at once if they both need an override', () => {
    const union = team(80, 'https://assets.dfb.de/union.jpg');
    const leverkusen = team(
      6,
      'https://www.bundesliga-reisefuehrer.de/b04.png'
    );

    teamSanitization(union, leverkusen);

    expect(union.teamIconUrl).not.toBe('https://assets.dfb.de/union.jpg');
    expect(leverkusen.teamIconUrl).not.toBe(
      'https://www.bundesliga-reisefuehrer.de/b04.png'
    );
  });

  it('leaves teams without a known CSP issue untouched', () => {
    const bayern = team(40, 'https://upload.wikimedia.org/bayern.svg');
    const leipzig = team(1635, 'https://i.imgur.com/leipzig.png');

    teamSanitization(bayern, leipzig);

    expect(bayern.teamIconUrl).toBe('https://upload.wikimedia.org/bayern.svg');
    expect(leipzig.teamIconUrl).toBe('https://i.imgur.com/leipzig.png');
  });
});
