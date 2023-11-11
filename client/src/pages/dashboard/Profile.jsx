import { useState } from 'react'
import { useAppContext } from '../../context/appContext'
import { Alert } from '../../components'

const Profile = () => {
  const { user, showAlert, displayAlert, updateUser, isLoading } =
    useAppContext()
  const [values, setValues] = useState({
    name: user?.name,
    email: user?.email,
    location: user?.location,
    team: user?.team,
  })

  const handleChange = (e) => {
    const { value, name } = e.target
    setValues({ ...values, [name]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { name, email } = values
    if (!name || !email) {
      displayAlert()
      return
    }
    updateUser(values)
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
              id="name"
              name="name"
              value={values.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>
          <div className="label-box">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
          <div className="label-box">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={values.location}
              onChange={handleChange}
              autoComplete="location"
            />
          </div>
          <div className="label-box">
            <label htmlFor="team">Favorite Team</label>
            <input
              type="text"
              id="team"
              name="team"
              value={values.team}
              onChange={handleChange}
              autoComplete="team"
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
