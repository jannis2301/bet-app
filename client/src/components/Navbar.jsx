import { Link, NavLink } from 'react-router-dom'
import { FaUserCircle, FaCaretDown } from 'react-icons/fa'
import Logo from './Logo'
import { useEffect, useState } from 'react'
import { useAppContext } from '../context/appContext'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userBetsOpen, setUserBetsOpen] = useState(false)
  const [showLogout, setShowLogout] = useState()
  const { logoutUser, user, allUsers, getAllUsers } = useAppContext()

  useEffect(() => {
    getAllUsers()
  }, [])

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/">
          <Logo />
        </Link>
        <ul className={isMenuOpen ? 'nav-links open' : 'nav-links'}>
          <li>
            <NavLink to="/" onClick={() => setIsMenuOpen(false)}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/placebet" onClick={() => setIsMenuOpen(false)}>
              Spieltag tippen
            </NavLink>
          </li>
          <li>
            <NavLink to="/leaderboard" onClick={() => setIsMenuOpen(false)}>
              Tabelle
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
              Profil
            </NavLink>
          </li>
          <li className="user-bets-box">
            <button
              type="button"
              className="bets-btn"
              onClick={() => setUserBetsOpen(!userBetsOpen)}
            >
              Bets
              <FaCaretDown />
            </button>
            <div
              className={`user-bets ${userBetsOpen ? 'show-user-bets' : ''}`}
            >
              {allUsers?.map((user, i) => {
                let displayName = user.name
                if (
                  displayName &&
                  displayName.charAt(displayName.length - 1) !== 's'
                ) {
                  displayName += 's'
                }
                return (
                  <NavLink
                    key={i}
                    to={`/bets/${user._id}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {displayName} Bets
                  </NavLink>
                )
              })}
            </div>
          </li>
        </ul>
        <div className="btn-container">
          <button
            type="button"
            className="btn user-btn"
            onClick={() => setShowLogout(!showLogout)}
          >
            <FaUserCircle />
            {user && user.name}
            <FaCaretDown />
          </button>
          <div className={`dropdown ${showLogout ? 'show-dropdown' : ''}`}>
            <button
              type="button"
              className="btn dropdown-btn"
              onClick={logoutUser}
            >
              logout
            </button>
          </div>
        </div>
        <button
          className={isMenuOpen ? 'hamburger-menu open' : 'hamburger-menu'}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
    </header>
  )
}
export default Navbar
