import { useAppContext } from '../../context/appContext'
import { useEffect } from 'react'
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi'

const Leaderboard = () => {
  const {
    leaderboard,
    bundesligaMatchday,
    fetchBundesligaMatches,
    getLeaderboard,
  } = useAppContext()

  useEffect(() => {
    getLeaderboard(bundesligaMatchday)
  }, [bundesligaMatchday])

  return (
    <section className="leaderboard-box">
      <div className="matchday-headline">
        <button
          className="prev-btn"
          onClick={() => fetchBundesligaMatches(bundesligaMatchday - 1)}
        >
          <HiArrowSmLeft />
          <p>vorheriger Spieltag</p>
        </button>
        <h1>Tabelle {bundesligaMatchday}. Spieltag</h1>
        <button
          className="next-btn"
          onClick={() => fetchBundesligaMatches(bundesligaMatchday + 1)}
        >
          <p>nächster Spieltag</p>
          <HiArrowSmRight />
        </button>
      </div>
      {leaderboard?.length > 0 ? (
        <>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard?.map((user, index) => {
                const { _id, name, totalPoints } = user
                return (
                  <tr key={_id}>
                    <td className="ranking">{index + 1}</td>
                    <td>{name}</td>
                    <td>{totalPoints}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      ) : (
        <div>
          <p>Keine Tabelle verfügbar</p>
        </div>
      )}
    </section>
  )
}
export default Leaderboard
