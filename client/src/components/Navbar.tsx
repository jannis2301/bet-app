import { useState } from 'react';
import { FaCaretDown, FaUserCircle } from 'react-icons/fa';
import { Link, NavLink } from 'react-router-dom';
import { useAppContext } from '../context/appContext';
import { useClickOutside } from '../hooks/useClickOutside';
import Logo from './Logo';

const NAV_LINKS = [
  { to: '/', label: 'Spieltag tippen' },
  { to: '/matchday', label: 'Bundesliga-Spieltag' },
  { to: '/bundesliga-table', label: 'Bundesliga-Tabelle' },
  { to: '/leaderboard', label: 'Tipp-Tabelle' },
  { to: '/bets', label: 'Alle Tipps' },
  { to: '/past-seasons', label: 'Archiv' },
  { to: '/profile', label: 'Profil' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const { logoutUser, user } = useAppContext();
  const userMenuRef = useClickOutside<HTMLDivElement>(
    () => setShowLogout(false),
    showLogout
  );
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/">
          <Logo />
        </Link>
        <ul className={isMenuOpen ? 'nav-links open' : 'nav-links'}>
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} onClick={closeMenu}>
                {label}
              </NavLink>
            </li>
          ))}
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
