import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/appContext';
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi';
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

  const [users, setUsers] = useState([]);
  const [userBets, setUserBets] = useState([]);

  useEffect(() => {
    getAllUsers();
  }, []);

  useEffect(() => {
    fetchBundesligaMatches(bundesligaMatchday);
    getUserBetsByMatchday(bundesligaMatchday);
  }, [bundesligaMatchday]);

  useEffect(() => {
    setUsers(allUsers);
    setUserBets(allMatchdayBets);
  }, [allMatchdayBets]);

  return (
    <section>
      <div className="matchday-headline">
        <button
          className="prev-btn"
          onClick={() => fetchBundesligaMatches(bundesligaMatchday - 1)}
          disabled={isLoading}
        >
          <HiArrowSmLeft />
          <p>vorheriger Spieltag</p>
        </button>
        <h1>Tipps für den {bundesligaMatchday}. Spieltag</h1>
        <button
          className="next-btn"
          onClick={() => fetchBundesligaMatches(bundesligaMatchday + 1)}
          disabled={isLoading}
        >
          <p>nächster Spieltag</p>
          <HiArrowSmRight />
        </button>
      </div>
      {users?.map((user) => {
        return (
          <div key={user._id} className="matches-box">
            <h2>{user.name}</h2>
            {bundesligaMatches?.map((match) => {
              const { matchID, team1, team2 } = match;
              teamSanitization(team1, team2);
              const matchesHaveFinished = bundesligaMatches?.every(
                (match) => match.matchIsFinished === true
              );

              const correspondingBet = userBets
                ?.filter((bet) => bet.createdBy === user._id)
                ?.find((bet) => bet.matchID === matchID);
              const { homeScore, awayScore, pointsEarned } =
                correspondingBet || [];

              return (
                <div
                  className={`game-box ${
                    matchesHaveFinished ? 'points-earned' : ''
                  }`}
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

                  <span className="score">
                    {homeScore ?? ''}:{awayScore ?? ''}
                  </span>

                  <span className="away-team">
                    <img
                      crossOrigin="anonymous"
                      className="club-icon"
                      src={team2.teamIconUrl}
                      alt={`${team2.shortName}-icon`}
                    />
                    <p>{team2.shortName}</p>
                  </span>

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
