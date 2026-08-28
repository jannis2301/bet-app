import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Alert } from '../../components';
import { useAppContext } from '../../context/appContext';
import type { BetFormEntry, Match, User } from '../../types';
import teamSanitization from '../../utils/teamSanitize';

const isMatchLocked = (match: Match) =>
  match.matchIsFinished || new Date(match.matchDateTimeUTC) <= new Date();

const PlaceBet = () => {
  const {
    showAlert,
    displayAlert,
    createBet,
    user,
    allMatchdayBets,
    bundesligaMatches,
    currentMatchday,
    bundesligaMatchday,
    fetchBundesligaMatches,
    getUserBetsByMatchday,
  } = useAppContext();

  // PlaceBet is only ever reached through ProtectedRoute, which already
  // guarantees a logged-in user before rendering its children.
  const userId = (user as User)._id;

  const [bets, setBets] = useState<BetFormEntry[]>([]);

  const hasExistingBets = allMatchdayBets?.some(
    (bet) => bet.createdBy === userId
  );
  const hasEditableMatches = bundesligaMatches?.some(
    (match) => !isMatchLocked(match)
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    i: number,
    matchID: number,
    matchDay: number
  ) => {
    const { name, value } = e.target;
    setBets((prevBets) => {
      const updatedBets = [...prevBets]; // create a copy of the bets array
      updatedBets[i] = {
        ...updatedBets[i], // keep existing properties
        matchID,
        matchDay,
        [name]: value, // update the specified property with the new value */
      };
      return updatedBets; // return the updated array to set the new state
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Only send bets for matches that haven't started — locked ones would
    // make the whole batch fail server-side (setUserBets rejects it as one).
    const editableBets = bets.filter(
      (_bet, i) => !isMatchLocked(bundesligaMatches[i])
    );

    let hasInvalidBet = false;
    editableBets.forEach((bet) => {
      const { matchDay, matchID, homeScore, awayScore } = bet;
      if (!matchDay || !matchID || homeScore === '' || awayScore === '') {
        displayAlert();
        hasInvalidBet = true;
        return;
      }
    });

    if (hasInvalidBet || editableBets.length === 0) return;
    await createBet(editableBets, userId);
    getUserBetsByMatchday(bundesligaMatchday);
  };

  // Prefill the form with the user's already placed bets, so they can be
  // reviewed and changed as long as the matchday hasn't started yet.
  useEffect(() => {
    if (!bundesligaMatches?.length) return;
    setBets(
      bundesligaMatches.map((match) => {
        const existingBet = allMatchdayBets?.find(
          (bet) => bet.matchID === match.matchID && bet.createdBy === userId
        );
        return {
          matchID: match.matchID,
          matchDay: match.group.groupOrderID,
          homeScore: existingBet?.homeScore ?? '',
          awayScore: existingBet?.awayScore ?? '',
        };
      })
    );
  }, [bundesligaMatches, allMatchdayBets, userId]);

  useEffect(() => {
    fetchBundesligaMatches();
  }, [fetchBundesligaMatches]);

  useEffect(() => {
    if (!bundesligaMatchday) return;
    getUserBetsByMatchday(bundesligaMatchday);
  }, [bundesligaMatchday, getUserBetsByMatchday]);

  return (
    <section className="placebets-box">
      <form className="matches-box" onSubmit={handleSubmit}>
        {showAlert && <Alert />}
        <h1 style={{ marginBlock: '1rem' }}>
          Tippe für den {currentMatchday}. Spieltag
        </h1>
        {bundesligaMatches?.map((match, i) => {
          const { matchID, team1, team2, group } = match;
          const locked = isMatchLocked(match);
          teamSanitization(team1, team2);

          return (
            <div
              className={`game-box game-score${locked ? ' locked' : ''}`}
              key={matchID}
            >
              <span className="home-team">
                <p>{team1.shortName}</p>
                <img
                  crossOrigin="anonymous"
                  className="club-icon"
                  src={team1.teamIconUrl}
                  alt={`${team1.shortName}-icon`}
                />
              </span>
              <input
                type="number"
                className="input-number"
                id={`homeScore${i}`}
                name="homeScore"
                value={bets[i]?.homeScore ?? ''}
                onChange={(e) =>
                  handleChange(e, i, matchID, group.groupOrderID)
                }
                min={0}
                max={10}
                required={!locked}
                disabled={locked}
              />
              <span> : </span>
              <input
                type="number"
                className="input-number"
                id={`awayScore${i}`}
                name="awayScore"
                value={bets[i]?.awayScore ?? ''}
                onChange={(e) =>
                  handleChange(e, i, matchID, group.groupOrderID)
                }
                min={0}
                max={10}
                required={!locked}
                disabled={locked}
              />
              <span className="away-team">
                <img
                  crossOrigin="anonymous"
                  className="club-icon"
                  src={team2.teamIconUrl}
                  alt={`${team2.shortName}-icon`}
                />
                <p>{team2.shortName}</p>
              </span>
            </div>
          );
        })}
        {hasEditableMatches && (
          <button className="btn placeBet-btn" type="submit">
            {hasExistingBets ? 'Tipps aktualisieren' : 'Place Bet!'}
          </button>
        )}
      </form>
    </section>
  );
};

export default PlaceBet;
