import { useEffect, useState } from 'react'
import { Alert } from '../../components'
import { useAppContext } from '../../context/appContext'
import teamSanitization from '../../utils/teamSanitize'
import { Link } from 'react-router-dom'

const PlaceBet = () => {
  const {
    showAlert,
    displayAlert,
    createBet,
    user,
    currentBets,
    getUserBets,
    allBetsPlaced,
    bundesligaMatches,
    currentMatchday,
    bundesligaMatchday,
    fetchBundesligaMatches,
  } = useAppContext()

  const [bets, setBets] = useState(currentBets)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [matchHasFinished, setMatchHasFinished] = useState(false)

  const handleChange = (e, i, matchID, matchDay) => {
    const { name, value } = e.target
    setBets((prevBets) => {
      const updatedBets = [...prevBets] // create a copy of the bets array
      updatedBets[i] = {
        ...updatedBets[i], // keep existing properties
        matchID,
        matchDay,
        [name]: value, // update the specified property with the new value */
      }
      return updatedBets // return the updated array to set the new state
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let hasInvalidBet = false
    bets.forEach((bet) => {
      const { matchDay, matchID, homeScore, awayScore } = bet
      if (!matchDay || !matchID || !homeScore || !awayScore) {
        displayAlert()
        hasInvalidBet = true
        return
      }
    })

    if (hasInvalidBet) return
    createBet(bets, user._id)
    setIsSubmitted(true)
  }

  const checkIfBetHasBeenPlaced = () => {
    const hasBetForMatchday = allBetsPlaced?.some(
      (bet) => bet.matchDay === currentMatchday
    )

    if (hasBetForMatchday) {
      setIsSubmitted(true)
    }
  }

  const checkIfMatchHasFinished = () => {
    const matchHasFinished = bundesligaMatches?.some(
      (match) => match.matchIsFinished === true
    )
    setMatchHasFinished(matchHasFinished)
  }

  useEffect(() => {
    checkIfMatchHasFinished()
    checkIfBetHasBeenPlaced()
  }, [allBetsPlaced, bundesligaMatchday, bundesligaMatches])

  useEffect(() => {
    getUserBets(user._id)
    fetchBundesligaMatches()
  }, [])

  return (
    <section className="placebets-box">
      {isSubmitted ? (
        <>
          <p style={{ marginBlock: '1.5rem' }}>
            Du hast bereits Tipps für den {currentMatchday}. Spieltag abgegeben.
          </p>
          <Link to={`/bets/${user._id}`} className="btn">
            My bets
          </Link>
        </>
      ) : (
        <form className="matches-box" onSubmit={handleSubmit}>
          {showAlert && <Alert />}
          <h1 style={{ marginBlock: '1rem' }}>
            Tippe für den {currentMatchday}. Spieltag
          </h1>
          {matchHasFinished && (
            <p style={{ marginBlock: '2rem' }}>
              Der Spieltag hat schon begonnen, Tipps sind nicht mehr möglich...
            </p>
          )}
          {!matchHasFinished &&
            bundesligaMatches?.map((match, i) => {
              const { matchID, team1, team2, group } = match
              teamSanitization(team1, team2)

              return (
                <div className="game-box game-score" key={matchID}>
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
                    required
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
                    required
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
              )
            })}
          {!matchHasFinished && (
            <button
              className="btn placeBet-btn"
              type="submit"
              disabled={isSubmitted}
            >
              Place Bet!
            </button>
          )}
        </form>
      )}
    </section>
  )
}

export default PlaceBet
