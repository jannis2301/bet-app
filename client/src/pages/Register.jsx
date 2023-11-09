import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/appContext'
import { Alert } from '../components'

const initialState = {
  name: '',
  email: '',
  password: '',
  isMember: false,
}

const Register = () => {
  const [values, setValues] = useState(initialState)
  //global state and useNavigate
  const { user, isLoading, showAlert, displayAlert, setupUser } =
    useAppContext()
  const navigate = useNavigate()

  const toggleMember = () =>
    setValues({ ...values, isMember: !values.isMember })

  const handleChange = (e) => {
    const { value, name } = e.target
    setValues({ ...values, [name]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { name, email, password, isMember } = values
    if (!email || !password || (!isMember && !name)) {
      displayAlert()
      return
    }
    const currentUser = { name, email, password }
    if (isMember) {
      setupUser({
        currentUser,
        endPoint: 'login',
        alertText: 'Login Successful! Redirecting...',
      })
    } else {
      setupUser({
        currentUser,
        endPoint: 'register',
        alertText: 'User Created! Redirecting...',
      })
    }
  }

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        navigate('/')
      }, 1000)
    }
  }, [user, navigate])

  return (
    <section className="register-box">
      <div className="form-container">
        {showAlert && <Alert />}
        <h1>{values.isMember ? 'Login' : 'Register'}</h1>
        <form className="form" onSubmit={handleSubmit}>
          {/* name input */}
          {!values.isMember && (
            <input
              type="text"
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Enter your name..."
              required
            />
          )}
          {/* email input */}
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            placeholder="Enter your email..."
            required
          />
          {/* password input */}
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            placeholder="Enter your password..."
            minLength={8}
            required
          />
          <button type="submit" className="btn btn-block" disabled={isLoading}>
            Submit
          </button>
          <p>
            {values.isMember ? 'Not a member yet?' : 'Already a member?'}
            <button
              type="button"
              onClick={toggleMember}
              className="btn member-btn"
            >
              {values.isMember ? 'Register' : 'Login'}
            </button>
          </p>
        </form>
      </div>
    </section>
  )
}
export default Register
