import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dark mode state (initial value comes from localStorage, default is light)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Apply the saved theme when the site loads, and save it whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Clear the logged-in user (and its JWT) then send the visitor to the login page
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Alzikrayat</Link>
        <div className="d-flex flex-wrap w-100 justify-content-between">
          <ul className="navbar-nav flex-row gap-3">
            <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/photos">Gallery</Link></li>
            {/* "Add Photo" is only shown to logged-in users */}
            {user && <li className="nav-item"><Link className="nav-link" to="/photos/new">Add Photo</Link></li>}
          </ul>
          <ul className="navbar-nav flex-row gap-3 align-items-center">
            {/* Dark mode toggle button */}
            <li className="nav-item">
              <button className="btn btn-sm btn-outline-light" onClick={toggleTheme}>
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </li>

            {/* Toolbar reflects the logged-in state: "Hi <firstName>" or "Please Login" */}
            {user ? (
              <>
                <li className="nav-item"><span className="nav-link text-white">Hi {user.firstName}</span></li>
                <li className="nav-item"><button className="btn btn-link nav-link" onClick={handleLogout}>Logout</button></li>
              </>
            ) : (
              <>
                <li className="nav-item"><span className="nav-link text-white">Please Login</span></li>
                <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}