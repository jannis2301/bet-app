const axios = require('axios')

const fetchBundesligaMatches = async (selectedMatchday) => {
  const matchDayURL = 'https://api.openligadb.de/getcurrentgroup/bl1'
  const getMatchesURL = 'https://api.openligadb.de/getmatchdata/bl1'

  let currentSeason =
    new Date().getMonth() > 6
      ? new Date().getFullYear()
      : new Date().getFullYear() - 1

  try {
    let matchdayToFetch

    if (selectedMatchday && selectedMatchday >= 1 && selectedMatchday <= 34) {
      matchdayToFetch = selectedMatchday
    } else {
      matchdayToFetch = await axios
        .get(matchDayURL)
        .then((res) => res.data.groupOrderID)
    }

    const { data: matchData } = await axios.get(
      `${getMatchesURL}/${currentSeason}/${matchdayToFetch}`
    )
    return { matchData, matchdayToFetch }
  } catch (error) {
    console.error(error)
  }
}

module.exports = { fetchBundesligaMatches }
