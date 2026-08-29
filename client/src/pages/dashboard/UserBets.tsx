import { useEffect } from 'react';
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi';
import { MatchTeam } from '../../components';
import { useAppContext } from '../../context/appContext';
import teamSanitization from '../../utils/teamSanitize';

const UserBets = () => {
  const {
    getUserBetsByMatchday,
    allMatchdayBets,
    bundesligaMatchday,
    bundesligaMatches,
    fetchBundesligaMatches,
    getAllUsers,
    allUsers,
    isLoading,
  } = useAppContext();

  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);

  useEffect(() => {
    fetchBundesligaMatches(bundesligaMatchday);
    getUserBetsByMatchday(bundesligaMatchday);
  }, [bundesligaMatchday, fetchBundesligaMatches, getUserBetsByMatchday]);

  return (
    <section>
      <div className="matchday-headline">
        <button
          type="button"
          className="prev-btn"
          onClick={() => fetchBundesligaMatches(Number(bundesligaMatchday) - 1)}
          disabled={isLoading}
        >
          <HiArrowSmLeft />
          <p>vorheriger Spieltag</p>
        </button>
        <h1>Tipps für den {bundesligaMatchday}. Spieltag</h1>
        <button
          type="button"
          className="next-btn"
          onClick={() => fetchBundesligaMatches(Number(bundesligaMatchday) + 1)}
          disabled={isLoading}
        >
          <p>nächster Spieltag</p>
          <HiArrowSmRight />
        </button>
      </div>
      {allUsers?.map((user) => {
        return (
          <div key={user._id} className="matches-box">
            <h2>{user.name}</h2>
            {bundesligaMatches?.map((match) => {
              const { matchID, team1, team2 } = match;
              teamSanitization(team1, team2);
              const matchesHaveFinished = bundesligaMatches?.every(
                (match) => match.matchIsFinished === true
              );

              const correspondingBet = allMatchdayBets
                ?.filter((bet) => bet.createdBy === user._id)
                ?.find((bet) => bet.matchID === matchID);
              const { homeScore, awayScore, pointsEarned } =
                correspondingBet || {};

              return (
                <div
                  className={`game-box ${
                    matchesHaveFinished ? 'points-earned' : ''
                  }`}
                  key={matchID}
                >
                  <MatchTeam team={team1} side="home" />

                  <span className="score">
                    {homeScore ?? ''}:{awayScore ?? ''}
                  </span>

                  <MatchTeam team={team2} side="away" />

                  {pointsEarned !== undefined && matchesHaveFinished && (
                    <p
                      style={{
                        color:
                          pointsEarned === 3
                            ? 'green'
                            : pointsEarned === 1
                              ? 'yellow'
                              : 'red',
                      }}
                    >
                      {pointsEarned > 0 ? `+${pointsEarned}` : pointsEarned}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </section>
  );
};

export default UserBets;
