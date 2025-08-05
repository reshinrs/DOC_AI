import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './Header.module.css';
import { FaSun, FaMoon, FaUpload, FaUserShield } from 'react-icons/fa';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <NavLink to="/" className={styles.logo}>
          MAS<span>.ai</span>
        </NavLink>
        <div className={styles.navMenu}>
          {user ? (
            <>
              <NavLink to="/" className={styles.navLink} end>
                Documents
              </NavLink>
              <NavLink to="/ats-checker" className={styles.navLink}>
                ATS Checker
              </NavLink>
              <NavLink to="/analytics" className={styles.navLink}>
                Analytics
              </NavLink>
              {user.role === 'Admin' && (
                <NavLink to="/admin" className={styles.navLink}>
                  <FaUserShield style={{ marginRight: '0.25rem' }} /> Admin
                </NavLink>
              )}
              <div className={styles.separator}></div>
              <NavLink to="/upload" className={`btn ${styles.uploadBtn}`}>
                <FaUpload /> Upload
              </NavLink>
              <button
                onClick={toggleTheme}
                className={styles.themeToggle}
                title="Toggle Theme"
              >
                {theme === 'light' ? <FaMoon /> : <FaSun />}
              </button>
              <button
                onClick={handleLogout}
                className={styles.logoutBtn}
                title="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={styles.navLink}>
                Login
              </NavLink>
              <NavLink to="/register" className={styles.navLink}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
