import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Bet from '../models/Bet.js';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import * as fetchMatches from '../utils/fetchMatches.js';
import { getCurrentSeason } from '../utils/season.js';
import * as sendEmailModule from '../utils/sendEmail.js';
import { sendMatchdayReminders } from './matchdayReminder.js';

const fetchBundesligaMatches = vi.spyOn(fetchMatches, 'fetchBundesligaMatches');
const sendEmail = vi.spyOn(sendEmailModule, 'sendEmail');

const placeholderTeams = {
  team1: { teamId: 1, shortName: 'FCB', teamIconUrl: 'bayern.png' },
  team2: { teamId: 2, shortName: 'VfB', teamIconUrl: 'stuttgart.png' },
  group: { groupOrderID: 1 },
};

const inHours = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const upcomingMatch = (matchID: number, kickoffInHours: number) => ({
  matchID,
  matchDateTimeUTC: inHours(kickoffInHours),
  matchIsFinished: false,
  matchResults: [],
  ...placeholderTeams,
});

const createUser = async (overrides: Record<string, unknown> = {}) =>
  User.create({
    name: 'Test User',
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    password: 'password123',
    ...overrides,
  });

describe('sendMatchdayReminders', () => {
  beforeEach(() => {
    fetchBundesligaMatches.mockReset();
    sendEmail.mockReset();
    sendEmail.mockResolvedValue(undefined);
  });

  it('does nothing when no upcoming matches remain', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [],
      matchdayToFetch: 1,
    });

    await sendMatchdayReminders();

    expect(sendEmail).not.toHaveBeenCalled();
    await expect(Reminder.countDocuments()).resolves.toBe(0);
  });

  it('does nothing when the earliest kickoff is outside the reminder window', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [upcomingMatch(1, 48)],
      matchdayToFetch: 1,
    });
    await createUser({ email: 'far-away@example.com' });

    await sendMatchdayReminders();

    expect(sendEmail).not.toHaveBeenCalled();
    await expect(Reminder.countDocuments()).resolves.toBe(0);
  });

  it('emails only users who have not bet on the matchday yet', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [upcomingMatch(1, 5)],
      matchdayToFetch: 3,
    });
    const bettor = await createUser({ email: 'bettor@example.com' });
    await createUser({ email: 'forgetful@example.com' });
    await Bet.create({
      matchDay: 3,
      matchID: 1,
      season: getCurrentSeason(),
      homeScore: 1,
      awayScore: 0,
      createdBy: bettor._id,
    });

    await sendMatchdayReminders();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'forgetful@example.com' })
    );

    const reminder = await Reminder.findOne({
      season: getCurrentSeason(),
      matchday: 3,
    });
    expect(reminder).not.toBeNull();
  });

  it('does not email users who opted out of reminders', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [upcomingMatch(1, 5)],
      matchdayToFetch: 3,
    });
    await createUser({
      email: 'opted-out@example.com',
      emailRemindersEnabled: false,
    });
    await createUser({ email: 'forgetful@example.com' });

    await sendMatchdayReminders();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'forgetful@example.com' })
    );
  });

  it('does not send again once a reminder was already recorded for that matchday', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [upcomingMatch(1, 5)],
      matchdayToFetch: 3,
    });
    await createUser({ email: 'forgetful@example.com' });
    await Reminder.create({ season: getCurrentSeason(), matchday: 3 });

    await sendMatchdayReminders();

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('still records the reminder as sent even if one email fails', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [upcomingMatch(1, 5)],
      matchdayToFetch: 4,
    });
    await createUser({ email: 'ok@example.com' });
    await createUser({ email: 'broken@example.com' });
    sendEmail.mockImplementation(async ({ to }) => {
      if (to === 'broken@example.com') throw new Error('SMTP down');
    });

    await sendMatchdayReminders();

    expect(sendEmail).toHaveBeenCalledTimes(2);
    const reminder = await Reminder.findOne({
      season: getCurrentSeason(),
      matchday: 4,
    });
    expect(reminder).not.toBeNull();
  });

  it('never throws, even if fetching matches fails', async () => {
    fetchBundesligaMatches.mockRejectedValue(new Error('openligadb down'));

    await expect(sendMatchdayReminders()).resolves.toBeUndefined();
  });
});
