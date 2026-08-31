import { useEffect } from 'react';
import { MatchdayHeadline, MatchRow } from '../../components';
import { useAppContext } from '../../context/appContext';

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
      <MatchdayHeadline
        isLoading={isLoading}
        onPrev={() => fetchBundesligaMatches(Number(bundesligaMatchday) - 1)}
        onNext={() => fetchBundesligaMatches(Number(bundesligaMatchday) + 1)}
      >
        Tipps für den {bundesligaMatchday}. Spieltag
      </MatchdayHeadline>
      {allUsers?.map((user) => {
        return (
          <div key={user._id} className="matches-box">
            <h2>{user.name}</h2>
            {bundesligaMatches?.map((match) => {
              const { matchID, team1, team2 } = match;
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
                  <MatchRow team1={team1} team2={team2}>
                    <span className="score">
                      {homeScore ?? ''}:{awayScore ?? ''}
                    </span>
                  </MatchRow>

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
