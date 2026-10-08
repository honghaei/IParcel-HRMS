import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa'
import '../styles/Login.css'
import { API_BASE_URL } from '../config/api'

import iParcel from '../assets/IParcelPlusLogo.png'
import ipxpress from '../assets/Ipxpress2.png'
import swift from '../assets/Swift.png'
import nagali from '../assets/Nagali Logo Website.png'

const brands = [
  { name: 'IPARCEL PLUS', image: iParcel },
  { name: 'IPXPRESS', image: ipxpress },
  { name: 'SWIFT', image: swift },
  { name: 'NAGALI', image: nagali },
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % brands.length)
    }, 3200)
    return () => window.clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid username or password.')
        return
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/home')
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to connect to the HRMS server. Check the API configuration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="login-brand">
          <div className="ip-avatar"><span>IP</span><b>+</b></div>
          <div>
            <strong>IParcel HRMS</strong>
            <span>Employee Management System</span>
          </div>
        </div>

        <div className="showcase-copy">
          <span className="login-kicker">MULTI-COMPANY HR WORKSPACE</span>
          <h1>People. Growth.<br/>Better together.</h1>

          <div className="brand-stage">
            <img src={brands[currentIndex].image} alt={`${brands[currentIndex].name} logo`} />
          </div>
        </div>

        <div className="brand-tabs" aria-label="Company carousel">
          {brands.map((brand, index) => (
            <button
              type="button"
              key={brand.name}
              className={index === currentIndex ? 'active' : ''}
              onClick={() => setCurrentIndex(index)}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-brand">
            <div className="ip-avatar small"><span>IP</span><b>+</b></div>
            <div>
              <span className="eyebrow">WELCOME BACK</span>
              <small>IParcel HR Workspace</small>
            </div>
          </div>

          <h2>Sign in to IParcel HRMS</h2>

          <label>
            Username
            <div className="login-input">
              <FaUser />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="login-input">
              <FaLock />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  )
}
