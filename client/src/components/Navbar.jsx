import { Link, NavLink } from 'react-router-dom';
import { FaUserCircle, FaCaretDown } from 'react-icons/fa';
import Logo from './Logo';
import { useState } from 'react';
import { useAppContext } from '../context/appContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState();
  const { logoutUser, user } = useAppContext();

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
            <NavLink to="/bets" onClick={() => setIsMenuOpen(false)}>
              Tipps
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
              Profil
            </NavLink>
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
  );
};
export default Navbar;
