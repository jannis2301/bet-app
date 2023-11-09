import { useState } from 'react'
import { useAppContext } from '../../context/appContext'
import { Alert } from '../../components'

const Profile = () => {
  const { user, showAlert, displayAlert, updateUser, isLoading } =
    useAppContext()
  const [name, setName] = useState(user?.name)
  const [email, setEmail] = useState(user?.email)
  const [location, setLocation] = useState(user?.location)
  const [team, setTeam] = useState(user?.team)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email) {
      displayAlert()
      return
    }
    updateUser({ name, email, location, team })
  }

  return (
    <section className="profile-box">
      <form onSubmit={handleSubmit}>
        <h1>Profile</h1>
        {showAlert && <Alert />}
        <div className="form-center">
          <div className="label-box">
            <label htmlFor="name">Username</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="label-box">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="label-box">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="label-box">
            <label htmlFor="team">Favorite Team</label>
            <input
              type="text"
              name="team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn" disabled={isLoading}>
          Submit
        </button>
      </form>
    </section>
  )
}
export default Profile
