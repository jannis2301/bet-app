import Union from '../assets/images/union-icon.png'

const teamSanitization = (team1, team2) => {
  switch (true) {
    case team1.teamId === 80:
      team1.teamIconUrl = Union
      break
    case team2.teamId === 80:
      team2.teamIconUrl = Union
      break
    default:
      return null
  }
}

export default teamSanitization
