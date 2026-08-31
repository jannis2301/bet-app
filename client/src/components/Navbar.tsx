import { useState } from 'react';
import { FaCaretDown, FaUserCircle } from 'react-icons/fa';
import { Link, NavLink } from 'react-router-dom';
import { useAppContext } from '../context/appContext';
import { useClickOutside } from '../hooks/useClickOutside';
import Logo from './Logo';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const { logoutUser, user } = useAppContext();
  const userMenuRef = useClickOutside<HTMLDivElement>(
    () => setShowLogout(false),
    showLogout
  );

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/">
          <Logo />
        </Link>
        <ul className={isMenuOpen ? 'nav-links open' : 'nav-links'}>
          <li>
            <NavLink to="/" onClick={() => setIsMenuOpen(false)}>
              Spieltag tippen
            </NavLink>
          </li>
          <li>
            <NavLink to="/matchday" onClick={() => setIsMenuOpen(false)}>
              Bundesliga-Spieltag
            </NavLink>
          </li>
          <li>
            <NavLink to="/leaderboard" onClick={() => setIsMenuOpen(false)}>
              Tabelle
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/bundesliga-table"
              onClick={() => setIsMenuOpen(false)}
            >
              Bundesliga-Tabelle
            </NavLink>
          </li>
          <li>
            <NavLink to="/bets" onClick={() => setIsMenuOpen(false)}>
              Tipps
            </NavLink>
          </li>
          <li>
            <NavLink to="/past-seasons" onClick={() => setIsMenuOpen(false)}>
              Archiv
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
              Profil
            </NavLink>
          </li>
        </ul>
        <div className="btn-container" ref={userMenuRef}>
          <button
            type="button"
            aria-label="User button"
            className="btn user-btn"
            onClick={() => setShowLogout(!showLogout)}
          >
            <FaUserCircle />
            <span className="user-btn-name">{user?.name}</span>
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
          type="button"
          aria-label="Menu button"
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
